export type AuthUser = {
    id: number;
    email: string;
    name: string;
    systemRole: "user" | "admin" | "super_admin";
}