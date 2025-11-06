'use client'

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Plus, Edit3, Trash2, Calendar, User, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { apiRequest } from '@/lib/api';

// Функция для правильного получения даты в формате YYYY-MM-DD без проблем с временной зоной
const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}


interface Employee {
  id: number;
  full_name: string;
}

interface Exception {
  id: number;
  employee_id: number;
  full_name: string; // добавлено для совместимости с backend
  exception_date: string;
  reason: string;
  exception_type: string;
  created_at?: string;
}

interface ExceptionFormData {
  employee_id: string;
  exception_date: string;
  start_date: string;
  end_date: string;
  reason: string;
  exception_type: string;
}

export default function ExceptionsPage() {
  // ...сюда добавьте ваши хуки, функции и JSX, без дублирующихся интерфейсов и импортов...
}
