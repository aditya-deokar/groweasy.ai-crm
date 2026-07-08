"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, Upload } from "lucide-react";

export interface LeadSource {
  id: string;
  name: string;
  description: string;
  iconType: "google" | "linkedin" | "facebook" | "csv";
  connected: boolean;
}

interface SourceCardProps {
  source: LeadSource;
  onConnect: (id: string) => void;
  onUploadCsv: (id: string) => void;
}

export function SourceCard({ source, onConnect, onUploadCsv }: SourceCardProps) {
  const isCsv = source.id === "csv";
  const isComingSoon = !isCsv;

  const renderIcon = () => {
    switch (source.iconType) {
      case "google":
        return (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm border border-border/50">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
          </div>
        );
      case "linkedin":
        return (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0A66C2]/10">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" fill="#0A66C2" />
            </svg>
          </div>
        );
      case "facebook":
        return (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1877F2]/10">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z" fill="#1877F2" />
            </svg>
          </div>
        );
      case "csv":
        return (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card
      className={`flex flex-col h-full border shadow-sm transition-all duration-200 ${
        isComingSoon
          ? "opacity-60 border-dashed border-border/60"
          : "border-border/80 hover:shadow-md hover:border-[#0D652D]/30"
      }`}
    >
      <CardHeader className="flex flex-row items-start gap-3.5 space-y-0 pb-3">
        {renderIcon()}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold truncate">{source.name}</CardTitle>
            {isComingSoon && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 bg-muted text-muted-foreground border-border">
                Soon
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-4 pt-0">
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {source.description}
        </p>
      </CardContent>
      <CardFooter className="pt-0 border-t border-border/40 p-3.5">
        {isCsv ? (
          <Button
            size="sm"
            className="w-full bg-[#0D652D] text-white hover:bg-[#0A4D22] gap-2"
            onClick={() => onUploadCsv(source.id)}
          >
            <Upload className="h-3.5 w-3.5" />
            Upload CSV File
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => onConnect(source.id)}
          >
            Coming Soon
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
