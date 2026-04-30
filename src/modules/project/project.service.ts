import { env, prisma } from "../../config/index.js";
import {
  createApiKey,
  decryptApiKey,
  encryptApiKey,
  hashApiKey
} from "../../utils/api-key.js";
import { ApiError } from "../../utils/ApiError.js";
import { CreateProjectInput } from "./project.validation.js";

export async function listProjects(userId: string) {
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      keyHash: true,
      createdAt: true
    }
  });

  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    createdAt: project.createdAt,
    hasApiKey: Boolean(project.keyHash)
  }));
}

export async function createProject(userId: string, input: CreateProjectInput) {
  const apiKey = createApiKey();
  const project = await prisma.project.create({
    data: {
      userId,
      description: input.description || null,
      name: input.name,
      keyHash: hashApiKey(apiKey),
      encryptedKey: encryptApiKey(apiKey)
    },
    select: {
      id: true,
      name: true,
      description: true,
      keyHash: true,
      createdAt: true
    }
  });

  return {
    apiKey,
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      hasApiKey: Boolean(project.keyHash)
    }
  };
}

export async function getProjectApiKey(userId: string, projectId: string): Promise<string> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
      encryptedKey: {
        not: null
      }
    },
    select: { encryptedKey: true }
  });

  if (!project?.encryptedKey) {
    throw new ApiError(404, "No retrievable API key found.");
  }

  return decryptApiKey(project.encryptedKey);
}

export async function regenerateProjectApiKey(
  userId: string,
  projectId: string
): Promise<string> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true }
  });

  if (!project) {
    throw new ApiError(404, "Project not found.");
  }

  const apiKey = createApiKey();

  await prisma.project.update({
    where: { id: project.id },
    data: {
      encryptedKey: encryptApiKey(apiKey),
      keyHash: hashApiKey(apiKey)
    }
  });

  return apiKey;
}

export async function getProjectIdForApiKey(apiKey: string): Promise<string | null> {
  const keyHash = hashApiKey(apiKey);
  const existingProject = await prisma.project.findUnique({
    where: { keyHash },
    select: { id: true }
  });

  if (existingProject) {
    return existingProject.id;
  }

  if (!env.reqlensAutoCreateDevProject || apiKey !== env.reqlensDevApiKey) {
    return null;
  }

  const user = await prisma.user.upsert({
    where: { email: "dev@reqlens.local" },
    update: {},
    create: {
      id: "dev_user",
      name: "Dev User",
      email: "dev@reqlens.local",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  const project = await prisma.project.upsert({
    where: { id: "dev_project" },
    update: {},
    create: {
      id: "dev_project",
      userId: user.id,
      name: "Dev Project"
    }
  });

  await prisma.project.update({
    where: { id: project.id },
    data: { keyHash }
  });

  return project.id;
}
