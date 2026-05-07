import { createHash, randomBytes } from "node:crypto";
import { env, prisma } from "../../config/index.js";
import { renderProjectInviteEmail } from "../../emails/render-auth-email.js";
import {
  createApiKey,
  decryptApiKey,
  encryptApiKey,
  hashApiKey
} from "../../utils/api-key.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendEmail } from "../../utils/email.js";
import {
  AcceptProjectInviteInput,
  CreateProjectInput,
  CreateProjectInviteInput
} from "./project.validation.js";

const inviteExpiryMs = 7 * 24 * 60 * 60 * 1000;

export async function listProjects(userId: string) {
  const projects = await prisma.project.findMany({
    where: getAccessibleProjectWhere(userId),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userId: true,
      name: true,
      description: true,
      keyHash: true,
      createdAt: true,
      members: {
        select: {
          user: {
            select: {
              email: true,
              id: true,
              name: true
            }
          }
        }
      },
      invites: {
        where: { status: "pending" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          expiresAt: true,
          createdAt: true
        }
      }
    }
  });

  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    createdAt: project.createdAt,
    accessRole: project.userId === userId ? "owner" : "member",
    hasApiKey: Boolean(project.keyHash),
    invites: project.userId === userId ? project.invites : [],
    members: project.members.map((member) => member.user)
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
      accessRole: "owner",
      hasApiKey: Boolean(project.keyHash),
      invites: [],
      members: []
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

export async function deleteProject(userId: string, projectId: string): Promise<void> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true }
  });

  if (!project) {
    throw new ApiError(404, "Project not found.");
  }

  await prisma.$transaction([
    prisma.requestLog.deleteMany({ where: { projectId: project.id } }),
    prisma.project.delete({ where: { id: project.id } })
  ]);
}

export async function createProjectInvite(
  userId: string,
  projectId: string,
  input: CreateProjectInviteInput
) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: {
      id: true,
      name: true,
      user: {
        select: {
          email: true,
          name: true
        }
      }
    }
  });

  if (!project) {
    throw new ApiError(404, "Project not found.");
  }

  if (project.user.email.toLowerCase() === input.email) {
    throw new ApiError(400, "Project owner is already on this project.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true }
  });

  if (existingUser) {
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: existingUser.id
        }
      },
      select: { id: true }
    });

    if (existingMember) {
      throw new ApiError(400, "User is already a project member.");
    }
  }

  await prisma.projectInvite.updateMany({
    where: {
      projectId,
      email: input.email,
      status: "pending"
    },
    data: { status: "revoked" }
  });

  const token = randomBytes(32).toString("hex");
  const invite = await prisma.projectInvite.create({
    data: {
      projectId,
      email: input.email,
      tokenHash: hashInviteToken(token),
      expiresAt: new Date(Date.now() + inviteExpiryMs)
    },
    select: {
      id: true,
      email: true,
      expiresAt: true,
      createdAt: true
    }
  });

  const inviteUrl = `${env.webOrigin}/accept-invite?token=${token}`;
  const email = await renderProjectInviteEmail({
    inviterName: project.user.name,
    projectName: project.name,
    url: inviteUrl
  });

  await sendEmail({
    html: email.html,
    subject: `Invite to ${project.name} on Reqlens`,
    text: email.text,
    to: input.email
  });

  return { invite };
}

export async function acceptProjectInvite(userId: string, input: AcceptProjectInviteInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  });

  if (!user) {
    throw new ApiError(401, "Unauthorized.");
  }

  const invite = await prisma.projectInvite.findUnique({
    where: { tokenHash: hashInviteToken(input.token) },
    select: {
      id: true,
      email: true,
      expiresAt: true,
      projectId: true,
      status: true,
      project: {
        select: {
          name: true,
          userId: true
        }
      }
    }
  });

  if (!invite || invite.status !== "pending" || invite.expiresAt < new Date()) {
    throw new ApiError(400, "Invite is invalid or expired.");
  }

  if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
    throw new ApiError(403, "This invite belongs to another email address.");
  }

  if (invite.project.userId === userId) {
    await prisma.projectInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date(), status: "accepted" }
    });

    return { projectId: invite.projectId, projectName: invite.project.name };
  }

  await prisma.$transaction([
    prisma.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId: invite.projectId,
          userId
        }
      },
      update: {},
      create: {
        projectId: invite.projectId,
        userId
      }
    }),
    prisma.projectInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date(), status: "accepted" }
    })
  ]);

  return { projectId: invite.projectId, projectName: invite.project.name };
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

export function getAccessibleProjectWhere(userId: string) {
  return {
    OR: [
      { userId },
      {
        members: {
          some: { userId }
        }
      }
    ]
  };
}

function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
