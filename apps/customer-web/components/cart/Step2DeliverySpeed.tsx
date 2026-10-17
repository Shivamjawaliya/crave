'use client';

import React from 'react';
import { DeliverySpeed } from './types';

interface Step2DeliverySpeedProps {
  deliverySpeed: DeliverySpeed;
  setDeliverySpeed: (speed: DeliverySpeed) => void;
}

export default function Step2DeliverySpeed({
  deliverySpeed,
  setDeliverySpeed,
}: Step2DeliverySpeedProps) {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#ab2f00] text-white flex items-center justify-center font-black text-sm">
          2
        </div>
        <div>
          <h3 className="text-base font-black text-slate-900">
            Delivery Speed & Schedule
          </h3>
          <span className="text-xs text-slate-500">Paced for optimal culinary temperature</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Priority */}
        <div
          onClick={() => setDeliverySpeed('priority')}
          className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
            deliverySpeed === 'priority'
              ? 'border-[#ab2f00] bg-[#fff5f2]'
              : 'border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-lg">⚡</span>
            <span className="text-[10px] font-bold text-[#ab2f00] bg-[#ffdbd1] px-2 py-0.5 rounded-full">
              +$2.99
            </span>
          </div>
          <div className="pt-3">
            <strong className="text-xs font-black block text-slate-900">Priority</strong>
            <span className="text-[11px] text-slate-600 block">15–25 mins</span>
            <span className="text-[10px] text-[#ab2f00] font-bold block pt-1">Direct to door</span>
          </div>
        </div>

        {/* Standard */}
        <div
          onClick={() => setDeliverySpeed('standard')}
          className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
            deliverySpeed === 'standard'
              ? 'border-[#ab2f00] bg-[#fff5f2]'
              : 'border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-lg">⏱️</span>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
              FREE
            </span>
          </div>
          <div className="pt-3">
            <strong className="text-xs font-black block text-slate-900">Standard</strong>
            <span className="text-[11px] text-slate-600 block">25–35 mins</span>
            <span className="text-[10px] text-[#006c49] font-bold block pt-1">Popular</span>
          </div>
        </div>

        {/* Schedule */}
        <div
          onClick={() => setDeliverySpeed('schedule')}
          className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
            deliverySpeed === 'schedule'
              ? 'border-[#ab2f00] bg-[#fff5f2]'
              : 'border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-lg">📅</span>
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              Free
            </span>
          </div>
          <div className="pt-3">
            <strong className="text-xs font-black block text-slate-900">Schedule</strong>
            <span className="text-[11px] text-slate-600 block">Choose time slot</span>
            <span className="text-[10px] text-slate-500 font-medium block pt-1">Plan ahead</span>
          </div>
        </div>
      </div>
    </div>
  );
}
