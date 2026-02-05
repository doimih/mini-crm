export interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateCustomerInput {
    name: string;
    email: string;
    phone: string;
}

export interface UpdateCustomerInput {
    id: number;
    name?: string;
    email?: string;
    phone?: string;
}