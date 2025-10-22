export function usePagination(page, filesCount, limit) {
    const getPageNumbers = (page, lastPage) => {
        const delta = 2; // how many pages before and after current page
        const pages = [];

        // first page
        pages.push(1);

        // if there are more than 2 pages between page 1 and current page, write …
        if (page - delta > 2)
            pages.push("left-ellipsis");

        // pages around current page
        for (let p = Math.max(2, page - delta); p <= Math.min(lastPage - 1, page + delta); p++)
            pages.push(p);

        // if there are more than 2 pages between current page and last page, write …
        if (page + delta < lastPage - 1)
            pages.push("right-ellipsis");

        // last page (if bigger than 1)
        if (lastPage > 1)
            pages.push(lastPage);

        return pages;
    }

    const lastPage = Math.ceil(filesCount / limit);
    const pageNumbers = getPageNumbers(page, lastPage);

    return { pageNumbers };
}

export default usePagination;