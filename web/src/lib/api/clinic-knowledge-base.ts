import { platformApiRequest } from "@/lib/api/platform";

export interface Specialty {
  id: string;
  name: string;
}

export interface City {
  id: string;
  name: string;
}

export interface ClinicLocation {
  id: string;
  city_id: string;
  name: string;
  address: string;
  specialty_ids: string[];
}

export interface Doctor {
  id: string;
  clinic_id: string;
  specialty_id: string;
  name: string;
}

export interface PriceCard {
  specialty_id: string;
  clinic_id: string;
  doctor_id: string;
  consultation_fee_eur: number;
  currency: string;
}

export interface ClinicKnowledgeBase {
  specialties: Specialty[];
  cities: City[];
  clinics: ClinicLocation[];
  doctors: Doctor[];
  pricing: PriceCard[];
}

export function getClinicKnowledgeBase(): Promise<ClinicKnowledgeBase> {
  return platformApiRequest<ClinicKnowledgeBase>("/clinic/knowledge-base", {
    method: "GET",
  });
}
