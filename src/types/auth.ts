export type AuthUser = {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    systemRole: "user" | "admin" | "super_admin";
}