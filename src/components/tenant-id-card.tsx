
"use client"

import React from 'react';
import type { Tenant } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Logo } from './icons';
import { useAppContext } from '@/context/app-context';
import { Building, Cake, DollarSign, Home, User, UserCircle, MapPin, Calendar, CreditCard, Flame, Zap } from 'lucide-react';
import { Separator } from './ui/separator';
import { formatDate } from '@/lib/utils';

interface TenantIdCardProps {
  tenant: Tenant;
  innerRef: React.RefObject<HTMLDivElement>;
}

export const TenantIdCard: React.FC<TenantIdCardProps> = ({ tenant, innerRef }) => {
  const { settings } = useAppContext();

  const InfoRow: React.FC<{ icon: React.ElementType, label: string, value?: string | number }> = ({ icon: Icon, label, value }) => {
    if (!value) return null;
    return (
        <div className="flex items-start text-xs">
            <Icon className="h-3.5 w-3.5 mt-0.5 text-gray-500 mr-2 flex-shrink-0" />
            <div className="flex-1">
                <p className="font-medium text-gray-600">{label}</p>
                <p className="font-bold text-gray-800 break-words">{value}</p>
            </div>
        </div>
    );
  };

  return (
    <div ref={innerRef} className="w-[350px] bg-white border border-gray-200 rounded-xl shadow-lg p-0 font-sans">
      {/* Header */}
      <div className="bg-primary/10 text-primary p-4 rounded-t-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <div className="flex flex-col">
                <p className="font-bold text-sm">{settings.houseName}</p>
                <p className="text-xs">{settings.houseAddress}</p>
            </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                <AvatarImage src={tenant.avatar} />
                <AvatarFallback>
                    <UserCircle className="h-full w-full text-gray-300" />
                </AvatarFallback>
            </Avatar>
            <div>
                <h2 className="text-xl font-bold text-gray-900">{tenant.name}</h2>
                <p className="text-sm text-gray-600">Tenant</p>
            </div>
        </div>
        
        <Separator className="my-3"/>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <InfoRow icon={User} label="Father's Name" value={tenant.father_name} />
            <InfoRow icon={Home} label="Apartment/Unit" value={tenant.property} />
            <InfoRow icon={DollarSign} label="Monthly Rent" value={`${settings.currencySymbol}${tenant.rent.toFixed(2)}`} />
            <InfoRow icon={Calendar} label="Join Date" value={formatDate(tenant.join_date, settings.dateFormat)} />
            <InfoRow icon={Zap} label="Electric Meter #" value={tenant.electric_meter_number} />
            <InfoRow icon={Flame} label="Gas Meter #" value={tenant.gas_meter_number} />
            <div className="col-span-2">
                <InfoRow icon={MapPin} label="Address" value={tenant.address} />
            </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-gray-100 p-2 rounded-b-xl text-center">
         <p className="text-xs text-gray-500 font-medium">This card is for identification purposes only.</p>
      </div>
    </div>
  );
};
