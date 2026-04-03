type User = {
  id: number;
  systemRole: "user" | "admin" | "super_admin";
};

type Project = {
  id: number;
  createdBy: number;
};

export function canAccessProject(user: User, project: Project, projectRole: string | null){
    if(user.systemRole === "super_admin") return true;

    if(user.systemRole === "admin"){
        return project.createdBy === user.id;
    }

    if(user.systemRole === "user"){
        return !!projectRole;
    }

    return false;
}