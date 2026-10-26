import { Head, Link, router } from '@inertiajs/react';
import { Search, Star, Users } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import {
    QualificationBadge,
    StatusBadge,
} from '@/components/admin/application-badges';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { index, show } from '@/routes/admin/applications';
import type {
    ApplicationSummary,
    CountByCategory,
    ProvinceOption,
    Qualification,
    SelectOption,
} from '@/types';

type Filters = {
    search?: string;
    qualification?: string;
    status?: string;
    industry?: string;
    province?: string;
    district?: string;
    applicant_type?: string;
    sort?: string;
};

type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
    from: number | null;
    to: number | null;
};

type Stats = {
    total: number;
    averageScore: number;
    teams: number;
    byQualification: (CountByCategory & { value: Qualification })[];
    byStatus: CountByCategory[];
    byIndustry: CountByCategory[];
    byEducation: CountByCategory[];
    topDistricts: CountByCategory[];
};

const tierAccent: Record<Qualification, string> = {
    high: 'border-l-green-600',
    medium: 'border-l-amber-500',
    low: 'border-l-neutral-400',
    not_eligible: 'border-l-red-600',
};

export default function ApplicationsIndex({
    applications,
    filters,
    stats,
    topCandidates,
    options,
}: {
    applications: Paginated<ApplicationSummary>;
    filters: Filters;
    stats: Stats;
    topCandidates: ApplicationSummary[];
    options: {
        qualifications: SelectOption[];
        statuses: SelectOption[];
        industries: SelectOption[];
        provinces: ProvinceOption[];
    };
}) {
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilters = (changes: Filters) => {
        const next = { ...filters, ...changes };

        if ('province' in changes) {
            next.district = undefined;
        }

        router.get(
            index.url(),
            Object.fromEntries(
                Object.entries(next).filter(([, value]) => !!value),
            ),
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const submitSearch = (e: FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const districts =
        options.provinces.find((p) => p.value === filters.province)
            ?.districts ?? options.provinces.flatMap((p) => p.districts).sort();

    return (
        <>
            <Head title="Applications" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                        Fondo Robi applications
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {stats.total} applications · average score{' '}
                        {stats.averageScore}/100 · {stats.teams} team
                        applications
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.byQualification.map((tier) => (
                        <button
                            key={tier.value}
                            type="button"
                            onClick={() =>
                                applyFilters({
                                    qualification:
                                        filters.qualification === tier.value
                                            ? undefined
                                            : tier.value,
                                })
                            }
                            className={cn(
                                'rounded-xl border border-l-4 bg-card p-4 text-left shadow-sm transition-colors hover:bg-accent',
                                tierAccent[tier.value],
                                filters.qualification === tier.value &&
                                    'ring-2 ring-ring',
                            )}
                        >
                            <p className="text-sm text-muted-foreground">
                                {tier.label}
                            </p>
                            <p className="text-3xl font-semibold tabular-nums">
                                {tier.total}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {tierRange(tier.value)}
                            </p>
                        </button>
                    ))}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="size-4 text-green-600" />
                            Top highly qualified businesses
                        </CardTitle>
                        <CardDescription>
                            Eligible applications scoring 70 or more, best first
                            (rejected ones hidden).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {topCandidates.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No highly qualified applications yet.
                            </p>
                        ) : (
                            <ApplicationsTable applications={topCandidates} />
                        )}
                    </CardContent>
                </Card>

                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                    <BreakdownCard
                        title="By business sector"
                        items={stats.byIndustry}
                        total={stats.total}
                        onSelect={(value) => applyFilters({ industry: value })}
                    />
                    <BreakdownCard
                        title="Top districts"
                        items={stats.topDistricts}
                        total={stats.total}
                        onSelect={(value) => applyFilters({ district: value })}
                    />
                    <BreakdownCard
                        title="By education level"
                        items={stats.byEducation}
                        total={stats.total}
                    />
                    <BreakdownCard
                        title="By review status"
                        items={stats.byStatus}
                        total={stats.total}
                        onSelect={(value) => applyFilters({ status: value })}
                    />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All applications</CardTitle>
                        <CardDescription>
                            Showing {applications.from ?? 0}–
                            {applications.to ?? 0} of {applications.total}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="flex flex-wrap items-end gap-2">
                            <form
                                onSubmit={submitSearch}
                                className="flex w-full gap-2 sm:w-72"
                            >
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Name, business, ID, phone, FR-…"
                                    aria-label="Search applications"
                                />
                                <Button
                                    type="submit"
                                    variant="outline"
                                    size="icon"
                                    aria-label="Search"
                                >
                                    <Search />
                                </Button>
                            </form>
                            <FilterSelect
                                label="Qualification"
                                value={filters.qualification}
                                options={options.qualifications}
                                onChange={(value) =>
                                    applyFilters({ qualification: value })
                                }
                            />
                            <FilterSelect
                                label="Status"
                                value={filters.status}
                                options={options.statuses}
                                onChange={(value) =>
                                    applyFilters({ status: value })
                                }
                            />
                            <FilterSelect
                                label="Sector"
                                value={filters.industry}
                                options={options.industries}
                                onChange={(value) =>
                                    applyFilters({ industry: value })
                                }
                            />
                            <FilterSelect
                                label="Province"
                                value={filters.province}
                                options={options.provinces}
                                onChange={(value) =>
                                    applyFilters({ province: value })
                                }
                            />
                            <FilterSelect
                                label="District"
                                value={filters.district}
                                options={districts.map((d) => ({
                                    value: d,
                                    label: d,
                                }))}
                                onChange={(value) =>
                                    applyFilters({ district: value })
                                }
                            />
                            <FilterSelect
                                label="Applicant"
                                value={filters.applicant_type}
                                options={[
                                    {
                                        value: 'individual',
                                        label: 'Individual',
                                    },
                                    { value: 'team', label: 'Team' },
                                ]}
                                onChange={(value) =>
                                    applyFilters({ applicant_type: value })
                                }
                            />
                            <Select
                                value={filters.sort ?? 'score'}
                                onValueChange={(value) =>
                                    applyFilters({ sort: value })
                                }
                            >
                                <SelectTrigger
                                    className="w-40"
                                    aria-label="Sort"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="score">
                                        Highest score
                                    </SelectItem>
                                    <SelectItem value="newest">
                                        Newest first
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {Object.values(filters).some(Boolean) && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setSearch('');
                                        router.get(index.url());
                                    }}
                                >
                                    Clear filters
                                </Button>
                            )}
                        </div>

                        {applications.data.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                No applications match these filters.
                            </p>
                        ) : (
                            <ApplicationsTable
                                applications={applications.data}
                            />
                        )}

                        {applications.links.length > 3 && (
                            <nav
                                aria-label="Pagination"
                                className="flex flex-wrap gap-1"
                            >
                                {applications.links.map((link, i) =>
                                    link.url ? (
                                        <Button
                                            key={i}
                                            asChild
                                            size="sm"
                                            variant={
                                                link.active
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                        >
                                            <Link
                                                href={link.url}
                                                preserveScroll
                                                preserveState
                                            >
                                                {paginationLabel(link.label)}
                                            </Link>
                                        </Button>
                                    ) : (
                                        <Button
                                            key={i}
                                            size="sm"
                                            variant="outline"
                                            disabled
                                        >
                                            {paginationLabel(link.label)}
                                        </Button>
                                    ),
                                )}
                            </nav>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ApplicationsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Applications',
            href: index(),
        },
    ],
};

function tierRange(tier: Qualification): string {
    return {
        high: 'Score 70–100',
        medium: 'Score 50–69',
        low: 'Score below 50',
        not_eligible: 'Fails a mandatory requirement',
    }[tier];
}

function paginationLabel(label: string): string {
    return label
        .replace('&laquo;', '«')
        .replace('&raquo;', '»')
        .replace('pagination.previous', '« Previous')
        .replace('pagination.next', 'Next »');
}

function ApplicationsTable({
    applications,
}: {
    applications: ApplicationSummary[];
}) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="border-b text-left text-xs text-muted-foreground">
                    <tr>
                        <th className="py-2 pr-4 font-medium">Ref.</th>
                        <th className="py-2 pr-4 font-medium">Applicant</th>
                        <th className="py-2 pr-4 font-medium">Business</th>
                        <th className="py-2 pr-4 font-medium">District</th>
                        <th className="py-2 pr-4 text-right font-medium">
                            Score
                        </th>
                        <th className="py-2 pr-4 font-medium">Qualification</th>
                        <th className="py-2 pr-4 font-medium">Status</th>
                        <th className="py-2 font-medium">Submitted</th>
                    </tr>
                </thead>
                <tbody>
                    {applications.map((application) => (
                        <tr
                            key={application.id}
                            className="border-b last:border-0 hover:bg-muted/50"
                        >
                            <td className="py-2 pr-4 font-mono text-xs">
                                <Link
                                    href={show(application.id)}
                                    className="underline-offset-4 hover:underline"
                                >
                                    {application.reference}
                                </Link>
                            </td>
                            <td className="py-2 pr-4">
                                <Link
                                    href={show(application.id)}
                                    className="font-medium underline-offset-4 hover:underline"
                                >
                                    {application.full_name}
                                </Link>
                                {application.is_team && (
                                    <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                                        <Users className="size-3" />
                                        Team
                                    </span>
                                )}
                            </td>
                            <td className="py-2 pr-4">
                                <div>{application.business_name}</div>
                                <div className="text-xs text-muted-foreground">
                                    {application.industry}
                                </div>
                            </td>
                            <td className="py-2 pr-4">
                                {application.district}
                            </td>
                            <td className="py-2 pr-4 text-right font-semibold tabular-nums">
                                {application.score}
                            </td>
                            <td className="py-2 pr-4">
                                <QualificationBadge
                                    value={application.qualification}
                                    label={application.qualification_label}
                                />
                            </td>
                            <td className="py-2 pr-4">
                                <StatusBadge
                                    value={application.status}
                                    label={application.status_label}
                                />
                            </td>
                            <td className="py-2 whitespace-nowrap text-muted-foreground">
                                {application.submitted_at}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function BreakdownCard({
    title,
    items,
    total,
    onSelect,
}: {
    title: string;
    items: CountByCategory[];
    total: number;
    onSelect?: (value: string) => void;
}) {
    const max = Math.max(1, ...items.map((item) => item.total));

    return (
        <Card className="gap-4">
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No data yet.
                    </p>
                ) : (
                    <ul className="grid gap-2.5">
                        {items.map((item) => {
                            const share =
                                total > 0
                                    ? Math.round((item.total / total) * 100)
                                    : 0;
                            const content = (
                                <>
                                    <div className="flex justify-between gap-2 text-sm">
                                        <span className="truncate">
                                            {item.label}
                                        </span>
                                        <span className="text-muted-foreground tabular-nums">
                                            {item.total} · {share}%
                                        </span>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted">
                                        <div
                                            className="h-2 rounded-full bg-primary/80"
                                            style={{
                                                width: `${(item.total / max) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </>
                            );

                            return (
                                <li
                                    key={item.value}
                                    title={`${item.label}: ${item.total} (${share}%)`}
                                >
                                    {onSelect ? (
                                        <button
                                            type="button"
                                            onClick={() => onSelect(item.value)}
                                            className="grid w-full gap-1 rounded text-left hover:opacity-80"
                                        >
                                            {content}
                                        </button>
                                    ) : (
                                        <div className="grid gap-1">
                                            {content}
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

function FilterSelect({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value?: string;
    options: SelectOption[];
    onChange: (value: string | undefined) => void;
}) {
    return (
        <Select
            value={value ?? 'all'}
            onValueChange={(next) =>
                onChange(next === 'all' ? undefined : next)
            }
        >
            <SelectTrigger className="w-40" aria-label={label}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All {label.toLowerCase()}</SelectItem>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
