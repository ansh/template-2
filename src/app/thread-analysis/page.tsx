'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCompletion } from 'ai/react';

interface AnalysisResult {
    outline: string;
    deliverables: string;
    keyQuotes: string;
    contentStrategy: string;
    actionItems: string;
}

export default function ThreadAnalysis() {
    const [threadText, setThreadText] = useState('');
    const [results, setResults] = useState<AnalysisResult | null>(null);

    const { complete, isLoading } = useCompletion({
        api: '/api/openai/chat',
        onResponse: (response) => {
            if (!response.ok) {
                throw new Error('Failed to analyze thread');
            }
        },
        onFinish: (result) => {
            // Split the response into sections
            const sections = result.split(/(?=\d\.\s(?:Content\sOutline|Required\sDeliverables|Key\sQuotes|Content\sStrategy|Action\sItems))/i);

            setResults({
                outline: sections[1] || '',
                deliverables: sections[2] || '',
                keyQuotes: sections[3] || '',
                contentStrategy: sections[4] || '',
                actionItems: sections[5] || ''
            });
        },
        onError: (error) => {
            console.error('Analysis error:', error);
            alert('Failed to analyze thread. Please try again.');
        }
    });

    const analyzeThread = async () => {
        if (!threadText.trim()) {
            alert('Please enter some text to analyze');
            return;
        }

        try {
            await complete(JSON.stringify({
                messages: [
                    {
                        role: "system",
                        content: "You are an expert content analyst. Analyze the following text and provide 5 sections:\n1. Content Outline: Create a detailed outline of the main points\n2. Required Deliverables: List all potential content pieces needed\n3. Key Quotes: Extract the most meaningful quotes\n4. Content Strategy: Provide a distribution plan\n5. Action Items: List specific next steps\n\nFormat your response with section headers followed by the content for each section."
                    },
                    { role: "user", content: threadText }
                ]
            }));
        } catch (error) {
            console.error('Analysis error:', error);
            alert('Failed to analyze thread. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        href="/"
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                    >
                        ← Back
                    </Link>
                    <h1 className="text-2xl font-bold">Thread Analysis</h1>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                    <label className="block text-lg font-semibold mb-4">Thread</label>
                    <textarea
                        value={threadText}
                        onChange={(e) => setThreadText(e.target.value)}
                        className="w-full h-64 p-4 border rounded-lg mb-4 resize-none"
                        placeholder="Paste your thread content here..."
                    />
                    <button
                        onClick={analyzeThread}
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                    >
                        {isLoading ? 'Analyzing...' : 'Analyze Thread'}
                    </button>
                </div>

                {results && (
                    <div className="space-y-8">
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h2 className="text-xl font-bold mb-4">Content Outline</h2>
                            <div className="whitespace-pre-wrap">{results.outline}</div>
                        </div>

                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h2 className="text-xl font-bold mb-4">Required Deliverables</h2>
                            <div className="whitespace-pre-wrap">{results.deliverables}</div>
                        </div>

                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h2 className="text-xl font-bold mb-4">Key Quotes</h2>
                            <div className="whitespace-pre-wrap">{results.keyQuotes}</div>
                        </div>

                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h2 className="text-xl font-bold mb-4">Content Strategy</h2>
                            <div className="whitespace-pre-wrap">{results.contentStrategy}</div>
                        </div>

                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h2 className="text-xl font-bold mb-4">Action Items</h2>
                            <div className="whitespace-pre-wrap">{results.actionItems}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 