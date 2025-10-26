export const getAvatarInitials = (displayName: string) => {
    const parts = displayName.split(' ');
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return `${parts[0][0].toUpperCase()}${parts[parts.length - 1][0].toUpperCase()}`;
}