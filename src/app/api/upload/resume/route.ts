import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { parseResumeText, generateFingerprint } from '@/lib/resumeParser'
import { checkForDuplicates } from '@/lib/duplicateDetection'

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Get file buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        let text = ''

        // Parse based on file type
        if (file.type === 'application/pdf') {
            try {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const pdf = require('pdf-parse')
                const pdfData = await pdf(buffer)
                text = pdfData.text
            } catch (pdfError) {
                console.error('PDF parsing error:', pdfError)
                return NextResponse.json(
                    { error: 'Failed to parse PDF file' },
                    { status: 400 }
                )
            }
        } else if (
            file.type ===
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
            // For DOCX, we'll do basic text extraction
            // In production, use mammoth library
            try {
                const mammoth = await import('mammoth')
                const result = await mammoth.extractRawText({ buffer })
                text = result.value
            } catch (docxError) {
                console.error('DOCX parsing error:', docxError)
                return NextResponse.json(
                    { error: 'Failed to parse DOCX file' },
                    { status: 400 }
                )
            }
        } else {
            return NextResponse.json(
                { error: 'Unsupported file type. Please upload PDF or DOCX.' },
                { status: 400 }
            )
        }

        // Parse the text
        const parsed = parseResumeText(text)

        // Generate fingerprint and check for duplicates
        const fingerprint = generateFingerprint({
            email: parsed.email,
            phone: parsed.phone,
            name: parsed.name,
        })

        const duplicates = await checkForDuplicates({
            email: parsed.email,
            phone: parsed.phone,
            name: parsed.name,
            fingerprint,
        })

        return NextResponse.json({
            parsed,
            fingerprint,
            duplicates,
            rawText: text.substring(0, 2000), // Return first 2000 chars for preview
        })
    } catch (error) {
        console.error('Error parsing resume:', error)
        return NextResponse.json(
            { error: 'Failed to parse resume' },
            { status: 500 }
        )
    }
}
