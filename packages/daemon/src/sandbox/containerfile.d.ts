// A Containerfile imported as text (`with { type: 'text' }`): Bun inlines it, so a compiled daemon carries it.
declare module '*.Containerfile' {
    const content: string;
    export default content;
}
