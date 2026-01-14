// Type declarations for modules without types

declare module 'pdf-parse' {
    interface PDFResult {
        numpages: number
        numrender: number
        info: Record<string, string>
        metadata: Record<string, string> | null
        text: string
        version: string
    }

    function pdfParse(dataBuffer: Buffer | ArrayBuffer): Promise<PDFResult>
    export = pdfParse
}
