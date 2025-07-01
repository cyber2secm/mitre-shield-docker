export function createPageUrl(pageName: string) {
    // Handle URLs with query parameters (like "Matrix?platform=Windows")
    if (pageName.includes('?')) {
        const [page, queryString] = pageName.split('?');
        const normalizedPage = page.toLowerCase().replace(/ /g, '-');
        return '/' + normalizedPage + '?' + queryString;
    }
    
    // Handle regular page names
    return '/' + pageName.toLowerCase().replace(/ /g, '-');
}