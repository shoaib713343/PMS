export function getPagination(query: any){
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Number(query.limit) || 10, 100);

    const offset = (page - 1) * limit;

    const sortBy = query.sortBy || 'createdAt';

    const order = query.order === 'desc' ? 'DESC' : 'ASC';

    return {page, limit, offset, sortBy, order};
} 