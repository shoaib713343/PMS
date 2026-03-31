class ApiResponse{
    statusCode: number;
    message: string;
    success: boolean;
    data: any;

    constructor(
        statusCode: number,
        message: string = "Success",
        data: any = null,
    ){

        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.success = true;
        
    }
}

export {ApiResponse};