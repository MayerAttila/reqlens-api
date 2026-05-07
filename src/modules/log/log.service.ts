import { prisma } from "../../config/index.js";
import { getAccessibleProjectWhere } from "../project/project.service.js";

type ListLogsByProjectOptions = {
  errorsOnly?: boolean;
};

export async function listLogsByProject(
  userId: string,
  options: ListLogsByProjectOptions = {}
) {
  const logWhere = options.errorsOnly
    ? {
        statusCode: {
          gte: 400
        }
      }
    : undefined;

  const projects = await prisma.project.findMany({
    where: getAccessibleProjectWhere(userId),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      keyHash: true,
      requestLogs: {
        where: logWhere,
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
