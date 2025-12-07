'use client';

import React, { useState } from 'react';
import Editor from '@monaco-editor/react';

export default function PlaygroundPage() {
    const [code, setCode] = useState('// Welcome to the Playground\n\nconsole.log("Hello, world!");');
    const [output, setOutput] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    const runCode = () => {
        setIsRunning(true);
        setOutput([]);

        // Capture console.log output
        const logs: string[] = [];
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = (...args) => {
            logs.push(args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
        };
        console.error = (...args) => {
            logs.push(`❌ Error: ${args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ')}`);
        };
        console.warn = (...args) => {
            logs.push(`⚠️ Warning: ${args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ')}`);
        };

        try {
            // Execute the code
            const result = new Function(code)();
            if (result !== undefined) {
                logs.push(`→ ${typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}`);
            }
        } catch (error) {
            logs.push(`❌ ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            // Restore original console methods
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
            setOutput(logs);
            setIsRunning(false);
        }
    };

    const resetPlayground = () => {
        setCode('// Welcome to the Playground\n\nconsole.log("Hello, world!");');
        setOutput([]);
    };

    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
                <h1 className="text-xl font-bold">Playground</h1>
                <div className="flex gap-2">
                    <button
                        className="px-4 py-2 text-sm font-medium transition-colors rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        onClick={resetPlayground}
                    >
                        Reset
                    </button>
                    <button
                        className="px-4 py-2 text-sm font-medium transition-colors rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        onClick={runCode}
                        disabled={isRunning}
                    >
                        {isRunning ? 'Running...' : 'Run'}
                    </button>
                </div>
            </header>
            <main className="flex flex-1 overflow-hidden">
                {/* Editor Panel - Left Side */}
                <div className="w-1/2 h-full border-r border-border">
                    <Editor
                        height="100%"
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
                        loading={<div className="flex items-center justify-center h-full">Loading editor...</div>}
                    />
                </div>

                {/* Output Panel - Right Side */}
                <div className="w-1/2 h-full flex flex-col bg-[#1e1e1e]">
                    <div className="px-4 py-2 border-b border-border bg-[#252526]">
                        <span className="text-sm font-medium text-gray-400">Output</span>
                    </div>
                    <div className="flex-1 overflow-auto p-4 font-mono text-sm">
                        {output.length === 0 ? (
                            <div className="text-gray-500 italic">
                                Click "Run" to execute your code and see the output here.
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {output.map((line, index) => (
                                    <div
                                        key={index}
                                        className={`whitespace-pre-wrap ${line.startsWith('❌')
                                                ? 'text-red-400'
                                                : line.startsWith('⚠️')
                                                    ? 'text-yellow-400'
                                                    : line.startsWith('→')
                                                        ? 'text-blue-400'
                                                        : 'text-gray-200'
                                            }`}
                                    >
                                        {line}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
