import { prisma } from "../../config/index.js";

export async function listLogsByProject(userId: string) {
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      keyHash: true,
      requestLogs: {
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          method: true,
          path: true,
          statusCode: true,
          durationMs: true,
          errorMessage: true,
          createdAt: true
        }
      }
    }
  });

  return projects.map((project) => ({
    projectId: project.id,
    projectName: project.name,
    hasApiKey: Boolean(project.keyHash),
    logs: project.requestLogs
  }));
}
