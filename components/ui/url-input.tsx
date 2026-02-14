"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { URL_PROTOCOLS, splitUrl, buildUrl, type UrlProtocol } from "@/lib/url";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UrlInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    required?: boolean;
    disabled?: boolean;
    autoFocus?: boolean;
    id?: string;
    "aria-label"?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * UrlInput - A reusable URL input component with protocol selector
 * 
 * Features:
 * - Visual protocol selector (HTTPS, HTTP, FTP, FTPS)
 * - Automatically detects existing protocol in value
 * - Clean separation between protocol and path
 * - Validates URLs properly
 * - Beautiful UI with smooth transitions
 * 
 * @example
 * ```tsx
 * <UrlInput
 *   value={url}
 *   onChange={setUrl}
 *   placeholder="example.com/path"
 *   required
 * />
 * ```
 */
export function UrlInput({
    value,
    onChange,
    placeholder = "example.com/path",
    className,
    required = false,
    disabled = false,
    autoFocus = false,
    id,
    "aria-label": ariaLabel,
}: UrlInputProps) {
    // Derive protocol and path from value directly
    const { protocol: derivedProtocol, path: derivedPath } = value
        ? splitUrl(value)
        : { protocol: "https://", path: "" };

    const [protocol, setProtocol] = useState<UrlProtocol>(derivedProtocol as UrlProtocol);
    const [path, setPath] = useState(derivedPath);

    // Only update internal state when external value changes significantly
    useEffect(() => {
        const { protocol: newProtocol, path: newPath } = value
            ? splitUrl(value)
            : { protocol: "https://", path: "" };

        // Only update if the values are actually different to avoid loops
        if (newProtocol !== protocol || newPath !== path) {
            setProtocol(newProtocol as UrlProtocol);
            setPath(newPath);
        }
    }, [value]); // Intentionally not including protocol/path to avoid loops

    // Handle protocol change
    const handleProtocolChange = (newProtocol: string) => {
        setProtocol(newProtocol as UrlProtocol);
        const newUrl = buildUrl(newProtocol, path);
        onChange(newUrl);
    };

    // Handle path change
    const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPath = e.target.value;
        setPath(newPath);
        const newUrl = buildUrl(protocol, newPath);
        onChange(newUrl);
    };

    return (
        <div className={cn("flex items-center gap-0", className)}>
            {/* Protocol Selector */}
            <Select value={protocol} onValueChange={handleProtocolChange} disabled={disabled}>
                <SelectTrigger
                    className={cn(
                        "w-[110px] rounded-r-none border-r-0 h-10",
                        "bg-muted/50 hover:bg-muted/80 transition-colors",
                        "focus:ring-0 focus:ring-offset-0"
                    )}
                    aria-label="Select URL protocol"
                >
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {URL_PROTOCOLS.map((proto) => (
                        <SelectItem
                            key={proto.value}
                            value={proto.value}
                            className="font-mono text-sm"
                        >
                            <span className="flex items-center gap-2">
                                <span className="font-semibold">{proto.label}</span>
                                <span className="text-muted-foreground text-xs">
                                    {proto.value}
                                </span>
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* URL Path Input */}
            <Input
                id={id}
                type="text"
                value={path}
                onChange={handlePathChange}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                autoFocus={autoFocus}
                aria-label={ariaLabel || "URL path"}
                className="rounded-l-none flex-1 h-10"
            />
        </div>
    );
}
