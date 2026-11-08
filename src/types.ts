import { Type } from "@google/genai";
import React from 'react';

export interface AppConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  component: React.ComponentType<any>;
}

export interface WindowState {
  id: string;
  appId: string;
  isMaximized: boolean;
  isMinimized: boolean;
  zIndex: number;
}
