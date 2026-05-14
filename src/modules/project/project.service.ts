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
  CreateProjectInviteInput,
  ProjectMemberRole,
  UpdateProjectMemberRoleInput,
  UpdateProjectInput,
  UpdateProjectSettingsInput
} from "./project.validation.js";

const inviteExpiryMs = 7 * 24 * 60 * 60 * 1000;
const defaultLatencyErrorThresholdMs = 750;
const writeRoles = ["owner", "admin"] as const;
const apiKeyReadRoles = ["owner", "admin", "developer"] as const;

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
      user: {
        select: {
          email: true,
          id: true,
          name: true
        }
      },
      members: {
        select: {
          role: true,
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
      },
      settings: {
        select: {
          errorEmailAudience: true,
          errorEmailCustomUserIds: true,
          errorEmailEnabled: true,
          errorEmailRecipient: true,
          latencyEmailAudience: true,
          latencyEmailCustomUserIds: true,
          latencyEmailEnabled: true,
          latencyEmailRecipient: true,
          latencyErrorThresholdMs: true
        }
      }
    }
  });

  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    createdAt: project.createdAt,
    accessRole:
      project.userId === userId
        ? "owner"
        : normalizeProjectRole(
            project.members.find((member) => member.user.id === userId)?.role
          ),
    hasApiKey: Boolean(project.keyHash),
    owner: project.user,
    settings: normalizeProjectSettings(project.settings),
    invites:
      project.userId === userId ||
      normalizeProjectRole(
        project.members.find((member) => member.user.id === userId)?.role
      ) === "admin"
        ? project.invites
        : [],
    members: project.members.map((member) => ({
      ...member.user,
      role: normalizeProjectRole(member.role)
    }))
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
      encryptedKey: encryptApiKey(apiKey),
      settings: {
        create: {
          latencyErrorThresholdMs: defaultLatencyErrorThresholdMs
        }
      }
    },
    select: {
      id: true,
      name: true,
      description: true,
      keyHash: true,
      settings: {
        select: {
          errorEmailAudience: true,
          errorEmailCustomUserIds: true,
          errorEmailEnabled: true,
          errorEmailRecipient: true,
          latencyEmailAudience: true,
          latencyEmailCustomUserIds: true,
          latencyEmailEnabled: true,
          latencyEmailRecipient: true,
          latencyErrorThresholdMs: true
        }
      },
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
      owner: null,
      settings: normalizeProjectSettings(project.settings),
      invites: [],
      members: []
    }
  };
}

export async function updateProject(
  userId: string,
  projectId: string,
  input: UpdateProjectInput
) {
  const project = await requireProjectRole(userId, projectId, writeRoles);

  const updatedProject = await prisma.project.update({
    where: { id: project.id },
    data: {
      description: input.description || null,
      name: input.name
    },
    select: {
      createdAt: true,
      description: true,
      id: true,
      keyHash: true,
      settings: {
        select: {
          errorEmailAudience: true,
          errorEmailCustomUserIds: true,
          errorEmailEnabled: true,
          errorEmailRecipient: true,
          latencyEmailAudience: true,
          latencyEmailCustomUserIds: true,
          latencyEmailEnabled: true,
          latencyEmailRecipient: true,
          latencyErrorThresholdMs: true
        }
      },
      name: true
    }
  });

  return {
    project: {
      id: updatedProject.id,
      name: updatedProject.name,
      description: updatedProject.description,
      createdAt: updatedProject.createdAt,
      accessRole: "owner",
      hasApiKey: Boolean(updatedProject.keyHash),
      settings: normalizeProjectSettings(updatedProject.settings)
    }
  };
}

export async function updateProjectSettings(
  userId: string,
  projectId: string,
  input: UpdateProjectSettingsInput
) {
  const project = await requireProjectRole(userId, projectId, writeRoles);
  const settings = await prisma.projectSetting.upsert({
    where: { projectId: project.id },
    update: {
      errorEmailAudience: input.errorEmailAudience,
      errorEmailCustomUserIds: input.errorEmailCustomUserIds,
      errorEmailEnabled: input.errorEmailEnabled,
      errorEmailRecipient: input.errorEmailRecipient || null,
      latencyEmailAudience: input.latencyEmailAudience,
      latencyEmailCustomUserIds: input.latencyEmailCustomUserIds,
      latencyEmailEnabled: input.latencyEmailEnabled,
      latencyEmailRecipient: input.latencyEmailRecipient || null,
      latencyErrorThresholdMs: input.latencyErrorThresholdMs
    },
    create: {
      projectId: project.id,
      errorEmailAudience: input.errorEmailAudience,
      errorEmailCustomUserIds: input.errorEmailCustomUserIds,
      errorEmailEnabled: input.errorEmailEnabled,
      errorEmailRecipient: input.errorEmailRecipient || null,
      latencyEmailAudience: input.latencyEmailAudience,
      latencyEmailCustomUserIds: input.latencyEmailCustomUserIds,
      latencyEmailEnabled: input.latencyEmailEnabled,
      latencyEmailRecipient: input.latencyEmailRecipient || null,
      latencyErrorThresholdMs: input.latencyErrorThresholdMs
    },
    select: {
      errorEmailAudience: true,
      errorEmailCustomUserIds: true,
      errorEmailEnabled: true,
      errorEmailRecipient: true,
      latencyEmailAudience: true,
      latencyEmailCustomUserIds: true,
      latencyEmailEnabled: true,
      latencyEmailRecipient: true,
      latencyErrorThresholdMs: true
    }
  });

  return { settings: normalizeProjectSettings(settings) };
}

export async function getProjectApiKey(userId: string, projectId: string): Promise<string> {
  await requireProjectRole(userId, projectId, apiKeyReadRoles);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
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
  const project = await requireProjectRole(userId, projectId, writeRoles);

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
  const project = await requireProjectRole(userId, projectId, writeRoles);

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
  await requireProjectRole(userId, projectId, writeRoles);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
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
        role: "viewer",
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

export async function removeProjectMember(
  userId: string,
  projectId: string,
  memberUserId: string
) {
  await requireProjectRole(userId, projectId, writeRoles);

  const result = await prisma.projectMember.deleteMany({
    where: {
      projectId,
      userId: memberUserId
    }
  });

  if (result.count === 0) {
    throw new ApiError(404, "Project member not found.");
  }
}

export async function revokeProjectInvite(
  userId: string,
  projectId: string,
  inviteId: string
) {
  await requireProjectRole(userId, projectId, writeRoles);

  const result = await prisma.projectInvite.updateMany({
    where: {
      id: inviteId,
      projectId,
      status: "pending"
    },
    data: { status: "revoked" }
  });

  if (result.count === 0) {
    throw new ApiError(404, "Pending invite not found.");
  }
}

export async function updateProjectMemberRole(
  userId: string,
  projectId: string,
  memberUserId: string,
  input: UpdateProjectMemberRoleInput
) {
  await requireProjectRole(userId, projectId, writeRoles);

  const member = await prisma.projectMember.updateMany({
    where: {
      projectId,
      userId: memberUserId
    },
    data: { role: input.role }
  });

  if (member.count === 0) {
    throw new ApiError(404, "Project member not found.");
  }

  return { role: input.role };
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

async function requireProjectRole(
  userId: string,
  projectId: string,
  allowedRoles: readonly ProjectAccessRole[]
) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ...getAccessibleProjectWhere(userId)
    },
    select: {
      id: true,
      userId: true,
      members: {
        where: { userId },
        select: { role: true }
      }
    }
  });

  if (!project || project.id !== projectId) {
    const directProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true }
    });

    throw new ApiError(directProject ? 403 : 404, "Project not found.");
  }

  const accessRole: ProjectAccessRole =
    project.userId === userId
      ? "owner"
      : normalizeProjectRole(project.members[0]?.role);

  if (!allowedRoles.includes(accessRole)) {
    throw new ApiError(403, "You do not have permission for this project.");
  }

  return { id: project.id, role: accessRole };
}

type ProjectAccessRole = "admin" | "developer" | "owner" | "viewer";

function normalizeProjectRole(role: string | null | undefined): ProjectMemberRole {
  if (role === "admin" || role === "developer" || role === "viewer") {
    return role;
  }

  return "viewer";
}

function normalizeProjectSettings(
  settings:
    | {
        errorEmailAudience?: string;
        errorEmailCustomUserIds?: string[];
        errorEmailEnabled?: boolean;
        errorEmailRecipient?: string | null;
        latencyEmailAudience?: string;
        latencyEmailCustomUserIds?: string[];
        latencyEmailEnabled?: boolean;
        latencyEmailRecipient?: string | null;
        latencyErrorThresholdMs: number;
      }
    | null
    | undefined
) {
  return {
    errorEmailAudience: normalizeEmailAlertAudience(settings?.errorEmailAudience),
    errorEmailCustomUserIds: settings?.errorEmailCustomUserIds ?? [],
    errorEmailEnabled: settings?.errorEmailEnabled ?? false,
    errorEmailRecipient: settings?.errorEmailRecipient ?? null,
    latencyEmailAudience: normalizeEmailAlertAudience(settings?.latencyEmailAudience),
    latencyEmailCustomUserIds: settings?.latencyEmailCustomUserIds ?? [],
    latencyEmailEnabled: settings?.latencyEmailEnabled ?? false,
    latencyEmailRecipient: settings?.latencyEmailRecipient ?? null,
    latencyErrorThresholdMs:
      settings?.latencyErrorThresholdMs ?? defaultLatencyErrorThresholdMs
  };
}

function normalizeEmailAlertAudience(audience: string | null | undefined) {
  if (
    audience === "all" ||
    audience === "admin_and_above" ||
    audience === "developer_and_above" ||
    audience === "custom"
  ) {
    return audience;
  }

  return "admin_and_above";
}

function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
