class ApiError extends Error{
    statusCode: number;
    data: null;
    success: boolean;
    errors: any[];
    constructor(
        statusCode: number,
        message: string = "Something went wrong",
        errors: any[] = []
    ){
        super(message);

        this.statusCode = statusCode;
        this.message = message;
        this.success = false;
        this.data = null;
        this.errors = errors;

        Error.captureStackTrace(this, this.constructor);
    }

    }

export {ApiError};

