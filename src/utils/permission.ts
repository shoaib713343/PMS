import { ACTIONS } from "../constants/actions";

type Params = {
    user: { id: number; systemRole: string };
    action: string;
    project: any;
    projectRole?: string | null;
    resource?: any;
};

export function hasPermission({
    user,
    action,
    project,
    projectRole,
    resource,
}: Params) : boolean {
    if(user.systemRole === "super_admin") return true;

    if(user.systemRole === "admin"){
        return true;
    }

    if(user.systemRole === "user"){
        if(!projectRole) return false;

         switch (action) {

      // THREAD

      case ACTIONS.CREATE_THREAD:
        return true;

      case ACTIONS.UPDATE_THREAD:
      case ACTIONS.DELETE_THREAD:
        return resource?.createdBy === user.id;

      case ACTIONS.VIEW_THREAD:
        return true;

      // TASK
      case ACTIONS.CREATE_TASK:
        return false; 

      case ACTIONS.UPDATE_TASK:
        return (
          resource?.assignedTo === user.id
        );

      case ACTIONS.DELETE_TASK:
        return false;

      case ACTIONS.VIEW_TASK:
        return true;

      // MESSAGE
      case ACTIONS.SEND_MESSAGE:
        return true;

      case ACTIONS.DELETE_MESSAGE:
        return resource?.senderId === user.id;

      default:
        return false;
    }
  }
       

    

    return false;
}