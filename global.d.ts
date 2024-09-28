declare global {
    function print(text?: string, extend?: any): void;
    function input(prompt: string): Promise<string>;
    function clear(): void;
    function color(fg: string, bg?: string): void;
    function optionBox(options: {title: string, options: string[], default_option: number}): Promise<number>;
    function getKey(options?: string[]): Promise<string>;
    function locate(x: number, y: number)
    function pause(seconds: number): Promise<void>;
}

export {};