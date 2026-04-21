"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";

import { Badge } from "@grove/ui/badge";
import { Card, CardContent, CardHeader } from "@grove/ui/card";
import { DataTable, type DataTableColumn } from "@grove/ui/data-table";
import { Input } from "@grove/ui/input";
import { PageFrame } from "@/components/page-frame";
import { PageHeader } from "@/components/page-header";
import { useTenantCopy } from "@/components/tenant-locale-provider";
import {
  getClinicKnowledgeBase,
  type City,
  type ClinicLocation,
  type Doctor,
  type PriceCard,
  type Specialty,
} from "@/lib/api/clinic-knowledge-base";
import { toErrorMessage } from "@grove/web-shared/lib/error-message";
import * as swrKeys from "@/lib/swr-keys";

const EMPTY_SPECIALTIES: Specialty[] = [];
const EMPTY_CITIES: City[] = [];
const EMPTY_CLINICS: ClinicLocation[] = [];
const EMPTY_DOCTORS: Doctor[] = [];
const EMPTY_PRICING: PriceCard[] = [];

type DoctorRow = {
  id: string;
  name: string;
  specialtyId: string;
  specialty: string;
  clinicId: string;
  clinic: string;
  city: string;
  price: string;
};

export default function ClinicKnowledgeBasePage() {
  const copy = useTenantCopy();
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const { data, error, isLoading } = useSWR(swrKeys.clinicKnowledgeBase(), getClinicKnowledgeBase, {
    revalidateOnFocus: false,
  });

  const specialties = data?.specialties ?? EMPTY_SPECIALTIES;
  const cities = data?.cities ?? EMPTY_CITIES;
  const clinics = data?.clinics ?? EMPTY_CLINICS;
  const doctors = data?.doctors ?? EMPTY_DOCTORS;
  const pricing = data?.pricing ?? EMPTY_PRICING;

  const specialtyMap = useMemo(() => {
    const map = new Map<string, Specialty>();
    for (const specialty of specialties) {
      map.set(specialty.id, specialty);
    }
    return map;
  }, [specialties]);

  const cityMap = useMemo(() => {
    const map = new Map<string, City>();
    for (const city of cities) {
      map.set(city.id, city);
    }
    return map;
  }, [cities]);

  const clinicMap = useMemo(() => {
    const map = new Map<string, ClinicLocation>();
    for (const clinic of clinics) {
      map.set(clinic.id, clinic);
    }
    return map;
  }, [clinics]);

  const specialtyNameCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const specialty of specialties) {
      counts.set(specialty.name, (counts.get(specialty.name) ?? 0) + 1);
    }
    return counts;
  }, [specialties]);

  const clinicNameCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const clinic of clinics) {
      counts.set(clinic.name, (counts.get(clinic.name) ?? 0) + 1);
    }
    return counts;
  }, [clinics]);

  const priceMap = useMemo(() => {
    const map = new Map<string, PriceCard>();
    for (const item of pricing) {
      map.set(item.doctor_id, item);
    }
    return map;
  }, [pricing]);

  const doctorRows = useMemo<DoctorRow[]>(() => {
    return doctors.map((doctor) => {
      const specialty = specialtyMap.get(doctor.specialty_id);
      const clinic = clinicMap.get(doctor.clinic_id);
      const city = clinic ? cityMap.get(clinic.city_id) : undefined;
      const priceCard = priceMap.get(doctor.id);

      return {
        id: doctor.id,
        name: doctor.name,
        specialtyId: doctor.specialty_id,
        specialty: specialty?.name ?? copy.common.unknown,
        clinicId: doctor.clinic_id,
        clinic: clinic?.name ?? copy.common.unknown,
        city: city?.name ?? copy.common.unknown,
        price: priceCard ? `€${priceCard.consultation_fee_eur.toFixed(2)}` : "—",
      };
    });
  }, [cityMap, clinicMap, copy.common.unknown, doctors, priceMap, specialtyMap]);

  const filteredDoctors = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return doctorRows.filter((row) => {
      const matchesSearch = !query || row.name.toLowerCase().includes(query);
      const matchesSpecialty = !specialtyFilter || row.specialtyId === specialtyFilter;
      const matchesLocation = !locationFilter || row.clinicId === locationFilter;
      return matchesSearch && matchesSpecialty && matchesLocation;
    });
  }, [doctorRows, locationFilter, searchTerm, specialtyFilter]);

  const specialtyOptions = useMemo(
    () =>
      specialties.map((specialty) => ({
        id: specialty.id,
        label:
          (specialtyNameCounts.get(specialty.name) ?? 0) > 1
            ? `${specialty.name} (${specialty.id})`
            : specialty.name,
      })),
    [specialties, specialtyNameCounts],
  );

  const locationOptions = useMemo(
    () =>
      clinics.map((clinic) => {
        const cityName = cityMap.get(clinic.city_id)?.name;
        const isDuplicateName = (clinicNameCounts.get(clinic.name) ?? 0) > 1;
        return {
          id: clinic.id,
          label: isDuplicateName ? `${clinic.name} (${cityName ?? copy.common.unknown}, ${clinic.address})` : clinic.name,
        };
      }),
    [cityMap, clinicNameCounts, clinics, copy.common.unknown],
  );

  const columns: DataTableColumn<DoctorRow>[] = [
    {
      id: "name",
      header: copy.knowledgeBase.doctor,
      cell: (row) => (
        <div className="flex flex-col">
          <span data-testid={`doctor-name-${row.id}`} className="font-medium text-[var(--color-neutral-900)]">
            {row.name}
          </span>
        </div>
      ),
    },
    {
      id: "specialty",
      header: copy.knowledgeBase.specialty,
      cell: (row) => (
        <Badge variant="neutral" data-testid={`doctor-specialty-${row.id}`}>
          {row.specialty}
        </Badge>
      ),
    },
    {
      id: "clinic",
      header: copy.knowledgeBase.clinic,
      cell: (row) => (
        <div className="flex flex-col">
          <span data-testid={`doctor-clinic-${row.id}`} className="text-sm">
            {row.clinic}
          </span>
          <span className="text-xs text-[var(--color-neutral-500)]">{row.city}</span>
        </div>
      ),
    },
    {
      id: "price",
      header: copy.knowledgeBase.price,
      align: "right",
      cell: (row) => (
        <span data-testid={`doctor-price-${row.id}`} className="font-medium">
          {row.price}
        </span>
      ),
    },
  ];

  const loadError = error ? toErrorMessage(error) : null;

  return (
    <PageFrame className="px-6 py-8">
      <PageHeader title={copy.knowledgeBase.title} description={copy.knowledgeBase.description} />

      <Card className="border-[rgba(15,23,42,0.08)] shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
        <CardContent className="space-y-5 p-6">
          <div className="grid gap-3 md:grid-cols-[1.3fr_0.8fr_0.9fr]">
            <Input
              id="clinic-kb-search"
              data-testid="clinic-kb-search"
              label={copy.knowledgeBase.searchLabel}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.currentTarget.value)}
              placeholder={copy.knowledgeBase.searchPlaceholder}
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="clinic-kb-specialty" className="text-sm font-medium text-[var(--color-neutral-700)]">
                {copy.knowledgeBase.specialtyLabel}
              </label>
              <select
                id="clinic-kb-specialty"
                data-testid="clinic-kb-specialty"
                value={specialtyFilter}
                onChange={(event) => setSpecialtyFilter(event.currentTarget.value)}
                className="h-11 rounded-2xl border border-[rgba(15,23,42,0.12)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-neutral-900)]"
              >
                <option value="">{copy.knowledgeBase.specialtyAll}</option>
                {specialtyOptions.map((specialty) => (
                  <option key={specialty.id} value={specialty.id}>
                    {specialty.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="clinic-kb-location" className="text-sm font-medium text-[var(--color-neutral-700)]">
                {copy.knowledgeBase.clinicLabel}
              </label>
              <select
                id="clinic-kb-location"
                data-testid="clinic-kb-location"
                value={locationFilter}
                onChange={(event) => setLocationFilter(event.currentTarget.value)}
                className="h-11 rounded-2xl border border-[rgba(15,23,42,0.12)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-neutral-900)]"
              >
                <option value="">{copy.knowledgeBase.clinicAll}</option>
                {locationOptions.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[var(--color-bg-subtle)] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-neutral-500)]">
                {copy.knowledgeBase.doctor}
              </p>
              <p data-testid="stat-doctors" className={`mt-2 text-2xl font-semibold ${loadError ? "text-[var(--color-error-500)]" : "text-[var(--color-neutral-900)]"}`}>
                {loadError ? "—" : doctors.length}
              </p>
            </div>
            <div className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[var(--color-bg-subtle)] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-neutral-500)]">
                {copy.knowledgeBase.clinic}
              </p>
              <p data-testid="stat-locations" className={`mt-2 text-2xl font-semibold ${loadError ? "text-[var(--color-error-500)]" : "text-[var(--color-neutral-900)]"}`}>
                {loadError ? "—" : clinics.length}
              </p>
            </div>
            <div className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[var(--color-bg-subtle)] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-neutral-500)]">
                {copy.knowledgeBase.specialty}
              </p>
              <p data-testid="stat-specialties" className={`mt-2 text-2xl font-semibold ${loadError ? "text-[var(--color-error-500)]" : "text-[var(--color-neutral-900)]"}`}>
                {loadError ? "—" : specialties.length}
              </p>
            </div>
            <div className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[var(--color-bg-subtle)] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-neutral-500)]">
                {copy.knowledgeBase.city}
              </p>
              <p data-testid="stat-cities" className={`mt-2 text-2xl font-semibold ${loadError ? "text-[var(--color-error-500)]" : "text-[var(--color-neutral-900)]"}`}>
                {loadError ? "—" : cities.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[rgba(15,23,42,0.08)] shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
        <CardHeader>
          <h2 className="text-lg font-semibold">{copy.knowledgeBase.matchesTitle}</h2>
          <p className="text-sm text-[var(--color-neutral-500)]">{copy.knowledgeBase.matchesDescription}</p>
        </CardHeader>
        <CardContent>
          {loadError ? (
            <div
              data-testid="clinic-kb-error"
              className="rounded-2xl border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-4 py-3 text-sm text-[var(--color-error-700)]"
            >
              <p className="font-medium">{copy.knowledgeBase.loadErrorTitle}</p>
              <p className="mt-1">{copy.knowledgeBase.loadErrorDescription}</p>
              <p className="mt-2">{loadError}</p>
            </div>
          ) : isLoading ? (
            <p className="text-sm text-[var(--color-neutral-500)]">{copy.common.loading}</p>
          ) : (
            <div data-testid="clinic-kb-doctors-table">
              <DataTable
                columns={columns}
                rows={filteredDoctors}
                rowKey="id"
                emptyState={`${copy.knowledgeBase.emptyTitle} ${copy.knowledgeBase.emptyDescription}`}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-[rgba(15,23,42,0.08)] shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
          <CardHeader>
            <h2 className="text-lg font-semibold">{copy.knowledgeBase.availableClinics}</h2>
          </CardHeader>
          <CardContent>
            {loadError ? (
              <div
                data-testid="clinic-kb-locations-error"
                className="rounded-2xl border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-4 py-3 text-sm text-[var(--color-error-700)]"
              >
                {loadError}
              </div>
            ) : clinics.length === 0 ? (
              <p className="text-sm text-[var(--color-neutral-500)]">{copy.common.noResults}</p>
            ) : (
              <div data-testid="clinic-kb-locations" className="grid gap-3">
                {clinics.map((clinic) => {
                  const city = cityMap.get(clinic.city_id);
                  const clinicSpecialties = clinic.specialty_ids
                    .map((id) => specialtyMap.get(id)?.name)
                    .filter(Boolean) as string[];

                  return (
                    <div
                      key={clinic.id}
                      data-testid={`clinic-location-${clinic.id}`}
                      className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[var(--color-bg-subtle)] p-4"
                    >
                      <p className="font-medium text-[var(--color-neutral-900)]">{clinic.name}</p>
                      <p className="mt-1 text-sm text-[var(--color-neutral-600)]">{clinic.address}</p>
                      <p className="mt-1 text-sm text-[var(--color-neutral-500)]">{city?.name ?? copy.common.unknown}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {clinicSpecialties.map((name) => (
                          <Badge key={name} variant="neutral">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-[rgba(15,23,42,0.08)] shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
          <CardHeader>
            <h2 className="text-lg font-semibold">{copy.knowledgeBase.availableSpecialties}</h2>
          </CardHeader>
          <CardContent>
            {loadError ? (
              <div
                data-testid="clinic-kb-specialties-error"
                className="rounded-2xl border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-4 py-3 text-sm text-[var(--color-error-700)]"
              >
                {loadError}
              </div>
            ) : specialties.length === 0 ? (
              <p className="text-sm text-[var(--color-neutral-500)]">{copy.common.noResults}</p>
            ) : (
              <div data-testid="clinic-kb-specialties" className="flex flex-wrap gap-2">
                {specialties.map((specialty) => (
                  <Badge key={specialty.id} variant="neutral" data-testid={`specialty-${specialty.id}`}>
                    {specialty.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageFrame>
  );
}
