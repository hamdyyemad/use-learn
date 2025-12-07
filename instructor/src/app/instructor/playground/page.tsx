'use client';

import React, { useState } from 'react';
import Editor from '@monaco-editor/react';

export default function PlaygroundPage() {
    const [code, setCode] = useState('// Welcome to the Playground\n\nconsole.log("Hello, world!");');
    console.log(code)
    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
                <h1 className="text-xl font-bold">Playground</h1>
                <div className="flex gap-2">
                    <button
                        className="px-4 py-2 text-sm font-medium transition-colors rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        onClick={() => setCode('// Welcome to the Playground\n\nconsole.log("Hello, world!");')}
                    >
                        Reset
                    </button>
                    <button
                        className="px-4 py-2 text-sm font-medium transition-colors rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => {
                            console.log('Running code:', code);
                            alert('Code run! Check console for output (simulated).');
                        }}
                    >
                        Run
                    </button>
                </div>
            </header>
            <main className="flex-1 overflow-hidden">
                <Editor
                    height="100%"
                    width="50%"
                    defaultLanguage="javascript"
                    theme="vs-dark"
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        padding: { top: 16 },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        selectOnLineNumbers: true,
                        roundedSelection: false,
                        readOnly: false,
                    }}
                    loading={<div>Loading editor...</div>}

                />
            </main>
        </div>
    );
}
