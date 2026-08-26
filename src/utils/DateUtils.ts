const formatter = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
});

export function valueToReadableDate(date: number | Date | string): string {
    const dateObject: Date = new Date(date);
    return formatter.format(dateObject)
}
