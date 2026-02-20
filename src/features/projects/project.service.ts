// import { eq, isNull, and, sql } from "drizzle-orm";
// import { db } from "../../db";
// import { projectMembers } from "../../db/schema";
// import {  projects } from "../../db/schema/projects";
// import { ApiError } from "../../utils/ApiError";

// type CreateProjectInput = {
//     name: string;
//     description: string;
//     createdBy: number
// }
// class ProjectService{

//     async createProject(options: CreateProjectInput){
       
//     return await db.transaction(async (tx)=> {
//         const [project] = await tx
//             .insert(projects).values({
//                 name: options.name,
//                 description: options.description,
//                 createdBy: options.createdBy
//             }).returning()

//         await tx.insert(projectMembers).values({
//             projectId: project.id,
//             userId: options.createdBy,
//             role: "project_admin"
//         });
//         return project;
//     })

//     }

//     async listProjects(userId: number, role: string){
//         if(role === "admin"){
//             return await db
//                 .select({
//                     id: projects.id,
//                     name: projects.name,
//                     description: projects.description,
//                     memberCount: sql<number>`count(${projectMembers.id})`
//                 })
//                 .from(projects)
//                 .leftJoin(
//                     projectMembers,
//                     eq(projects.id, projectMembers.projectId)
//                 )
//                 .where(isNull(projects.deletedAt))
//                 .groupBy(projects.id);
//         }
//         return await db
//             .select({
//                 id: projects.id,
//                 name: projects.name,
//                 description: projects.description,
//                 memberCount: sql<number>`count(${projectMembers.id})`
//             })
//             .from(projects)
//             .innerJoin(
//                 projectMembers,
//                 eq(projects.id, projectMembers.projectId)
//             )
//             .where(
//                 and(
//                     eq(projectMembers.userId, userId),
//                     isNull(projects.deletedAt)
//                 )
//             )
//             .groupBy(projects.id)
//     }

//     async getProjectDetails(
//         projectId: number,
//         userId: number,
//         role: string
//     ) {
//     const result = await db
//     .select({
//       id: projects.id,
//       name: projects.name,
//       description: projects.description,
//       createdAt: projects.createdAt,
//     })
//     .from(projects)
//     .leftJoin(
//       projectMembers,
//       eq(projects.id, projectMembers.projectId)
//     )
//     .where(
//       and(
//         eq(projects.id, projectId),
//         isNull(projects.deletedAt),
//         role === "admin"
//           ? undefined
//           : eq(projectMembers.userId, userId)
//       )
//     );

//   const [project] = result;

//   if (!project) {
//     throw new ApiError(404, "Project not found or access denied");
//   }

//   return project;
//     }

//     async updateProject(projectId: number, data: any){
//         const [project] = await db.update(projects).set({
//             name: data.name,
//             description: data.description,
//             updatedAt: new Date()
//         }).where(
//             and(
//                 eq(projects.id, projectId),
//                 isNull(projects.deletedAt)
//             )
//         ).returning();

//         if(!project){
//             throw new ApiError(404, "Project not found")
//         }
//         return project;
//     }

//     async deleteProject(projectId: number, userId: number){
//         const result = await db.update(projects).set({
//             deletedAt: new Date(),
//             deletedBy: userId,
//         }).where(
//             and(
//                 eq(projects.id, projectId),
//                 isNull(projects.deletedAt)
//             )
//         ).returning()

//         if(result.length === 0){
//             throw new ApiError(404, "Porject not found")
//         }
//     }

// }

// export const projectService = new ProjectService();