import { Head, useForm } from '@inertiajs/react';
import { AlertTriangle, LoaderCircle } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import {
    QualificationBadge,
    StatusBadge,
} from '@/components/admin/application-badges';
import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatRwf } from '@/lib/utils';
import { index, show, update } from '@/routes/admin/applications';
import type { ApplicationStatus, Qualification, SelectOption } from '@/types';

type Application = {
    id: number;
    reference: string;
    full_name: string;
    date_of_birth: string;
    age: number;
    national_id: string;
    phone: string;
    email: string | null;
    province_label: string;
    district: string;
    sector: string;
    cell: string;
    village: string;
    is_team: boolean;
    team_representative_name: string | null;
    team_members_count: number | null;
    team_women_count: number | null;
    is_woman_led: boolean;
    is_adult: boolean;
    has_operated_one_year: boolean;
    is_main_occupation: boolean;
    can_continue_without_grant: boolean;
    creates_jobs: boolean;
    education_level_label: string;
    education_level_other: string | null;
    has_related_training: boolean;
    related_training_details: string | null;
    previous_work: string;
    received_previous_support: boolean;
    previous_support_details: string | null;
    has_assets: boolean;
    assets_details: string | null;
    grant_need: string;
    expected_impact: string;
    business_name: string;
    industry_label: string;
    industry_other: string | null;
    business_years_operating: number;
    business_district: string;
    business_sector: string;
    business_summary: string;
    planned_jobs: number;
    planned_jobs_for_women: number;
    budget_items: { description: string; quantity: string; amount: number }[];
    budget_total: number;
    will_submit_business_plan: boolean;
    signature_name: string;
    score: number;
    qualification: Qualification;
    qualification_label: string;
    status: ApplicationStatus;
    status_label: string;
    review_notes: string | null;
    business_plan_received_at: string | null;
    reviewer: { id: number; name: string } | null;
    reviewed_at: string | null;
    created_at: string;
};

const yesNo = (value: boolean) => (value ? 'Yes' : 'No');

export default function ApplicationShow({
    application,
    breakdown,
    ineligibilityReasons,
    statuses,
}: {
    application: Application;
    breakdown: { criterion: string; points: number; max: number }[];
    ineligibilityReasons: string[];
    statuses: SelectOption[];
}) {
    const form = useForm({
        status: application.status,
        review_notes: application.review_notes ?? '',
        business_plan_received: application.business_plan_received_at !== null,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.submit(update(application.id), { preserveScroll: true });
    };

    return (
        <>
            <Head
                title={`${application.reference} · ${application.full_name}`}
            />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="grid gap-1">
                        <p className="font-mono text-sm text-muted-foreground">
                            {application.reference} · submitted{' '}
                            {application.created_at.slice(0, 10)}
                        </p>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {application.business_name}
                        </h1>
                        <p className="text-muted-foreground">
                            {application.full_name}
                            {application.is_team &&
                                ' (team application)'} ·{' '}
                            {application.industry_label} ·{' '}
                            {application.business_district}
                        </p>
                        <div className="mt-1 flex gap-2">
                            <QualificationBadge
                                value={application.qualification}
                                label={application.qualification_label}
                            />
                            <StatusBadge
                                value={application.status}
                                label={application.status_label}
                            />
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-4xl font-semibold tabular-nums">
                            {application.score}
                            <span className="text-lg text-muted-foreground">
                                /100
                            </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Assessment score
                        </p>
                    </div>
                </div>

                {ineligibilityReasons.length > 0 && (
                    <Alert variant="destructive">
                        <AlertTriangle />
                        <AlertTitle>
                            Fails mandatory eligibility requirements
                        </AlertTitle>
                        <AlertDescription>
                            <ul className="list-disc pl-4">
                                {ineligibilityReasons.map((reason) => (
                                    <li key={reason}>{reason}</li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
                    <div className="grid content-start gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Score breakdown</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="grid gap-3">
                                    {breakdown.map((item) => (
                                        <li
                                            key={item.criterion}
                                            className="grid gap-1"
                                        >
                                            <div className="flex justify-between gap-4 text-sm">
                                                <span>{item.criterion}</span>
                                                <span className="font-medium tabular-nums">
                                                    {item.points}/{item.max}
                                                </span>
                                            </div>
                                            <div className="h-2 rounded-full bg-muted">
                                                <div
                                                    className="h-2 rounded-full bg-primary/80"
                                                    style={{
                                                        width: `${(item.points / item.max) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <Section title="A. Applicant identity">
                            <Detail label="Full name">
                                {application.full_name}
                            </Detail>
                            <Detail label="Date of birth">
                                {application.date_of_birth.slice(0, 10)} (age{' '}
                                {application.age})
                            </Detail>
                            <Detail label="National ID">
                                {application.national_id}
                            </Detail>
                            <Detail label="Phone">{application.phone}</Detail>
                            <Detail label="Email">
                                {application.email ?? '—'}
                            </Detail>
                            <Detail label="Residence">
                                {[
                                    application.province_label,
                                    application.district,
                                    application.sector,
                                    application.cell,
                                    application.village,
                                ].join(' / ')}
                            </Detail>
                            <Detail label="Team application">
                                {application.is_team
                                    ? `Yes — represented by ${application.team_representative_name}, ${application.team_women_count} women of ${application.team_members_count} members`
                                    : 'No'}
                            </Detail>
                        </Section>

                        <Section title="B. Eligibility confirmation">
                            <Detail label="Rwandan woman / team ≥50% women">
                                {yesNo(application.is_woman_led)}
                            </Detail>
                            <Detail label="At least 18 years old">
                                {yesNo(application.is_adult)}
                            </Detail>
                            <Detail label="Business operating ≥ 1 year">
                                {yesNo(application.has_operated_one_year)}
                            </Detail>
                            <Detail label="Business is main daily work">
                                {yesNo(application.is_main_occupation)}
                            </Detail>
                            <Detail label="Would continue without the grant">
                                {yesNo(application.can_continue_without_grant)}
                            </Detail>
                            <Detail label="Employs / will employ others">
                                {yesNo(application.creates_jobs)}
                            </Detail>
                        </Section>

                        <Section title="C. Background">
                            <Detail label="Highest education">
                                {application.education_level_label}
                                {application.education_level_other &&
                                    ` — ${application.education_level_other}`}
                            </Detail>
                            <Detail label="Related training / certificate">
                                {application.has_related_training
                                    ? application.related_training_details
                                    : 'No'}
                            </Detail>
                            <Detail label="Previous / parallel work">
                                {application.previous_work}
                            </Detail>
                            <Detail label="Previous grant or support">
                                {application.received_previous_support
                                    ? application.previous_support_details
                                    : 'No'}
                            </Detail>
                            <Detail label="Land, equipment or assets">
                                {application.has_assets
                                    ? application.assets_details
                                    : 'No'}
                            </Detail>
                            <Detail label="Why they need the grant">
                                {application.grant_need}
                            </Detail>
                            <Detail label="Expected impact on life & family">
                                {application.expected_impact}
                            </Detail>
                        </Section>

                        <Section title="D. Business summary">
                            <Detail label="Business name">
                                {application.business_name}
                            </Detail>
                            <Detail label="Sector">
                                {application.industry_label}
                                {application.industry_other &&
                                    ` — ${application.industry_other}`}
                            </Detail>
                            <Detail label="Years operating">
                                {application.business_years_operating}
                            </Detail>
                            <Detail label="Location">
                                {application.business_district} /{' '}
                                {application.business_sector}
                            </Detail>
                            <Detail label="Summary and main goals">
                                {application.business_summary}
                            </Detail>
                            <Detail label="New jobs planned">
                                {application.planned_jobs} (
                                {application.planned_jobs_for_women} for women)
                            </Detail>
                        </Section>

                        <Card>
                            <CardHeader>
                                <CardTitle>Budget</CardTitle>
                                <CardDescription>
                                    How the {formatRwf(5_000_000)} grant would
                                    be used
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b text-left text-xs text-muted-foreground">
                                        <tr>
                                            <th className="py-2 pr-4 font-medium">
                                                Activity / item
                                            </th>
                                            <th className="py-2 pr-4 font-medium">
                                                Quantity
                                            </th>
                                            <th className="py-2 text-right font-medium">
                                                Amount
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {application.budget_items.map(
                                            (item, i) => (
                                                <tr
                                                    key={i}
                                                    className="border-b"
                                                >
                                                    <td className="py-2 pr-4">
                                                        {item.description}
                                                    </td>
                                                    <td className="py-2 pr-4">
                                                        {item.quantity}
                                                    </td>
                                                    <td className="py-2 text-right tabular-nums">
                                                        {formatRwf(item.amount)}
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                        <tr className="font-semibold">
                                            <td className="py-2" colSpan={2}>
                                                Total
                                            </td>
                                            <td className="py-2 text-right tabular-nums">
                                                {formatRwf(
                                                    application.budget_total,
                                                )}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>

                        <Section title="E & F. Attachment and signature">
                            <Detail label="Committed to submit business plan">
                                {yesNo(application.will_submit_business_plan)}
                            </Detail>
                            <Detail label="Signed as">
                                {application.signature_name}
                            </Detail>
                        </Section>
                    </div>

                    <Card className="h-fit lg:sticky lg:top-4">
                        <CardHeader>
                            <CardTitle>Review</CardTitle>
                            {application.reviewer && (
                                <CardDescription>
                                    Last reviewed by {application.reviewer.name}{' '}
                                    on {application.reviewed_at?.slice(0, 10)}
                                </CardDescription>
                            )}
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={form.data.status}
                                        onValueChange={(value) =>
                                            form.setData(
                                                'status',
                                                value as ApplicationStatus,
                                            )
                                        }
                                    >
                                        <SelectTrigger
                                            id="status"
                                            className="w-full"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statuses.map((status) => (
                                                <SelectItem
                                                    key={status.value}
                                                    value={status.value}
                                                >
                                                    {status.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={form.errors.status} />
                                </div>

                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id="business_plan_received"
                                        checked={
                                            form.data.business_plan_received
                                        }
                                        onCheckedChange={(checked) =>
                                            form.setData(
                                                'business_plan_received',
                                                checked === true,
                                            )
                                        }
                                        className="mt-0.5"
                                    />
                                    <Label
                                        htmlFor="business_plan_received"
                                        className="leading-snug font-normal"
                                    >
                                        Business plan received
                                    </Label>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="review_notes">
                                        Review notes
                                    </Label>
                                    <Textarea
                                        id="review_notes"
                                        rows={6}
                                        value={form.data.review_notes}
                                        onChange={(e) =>
                                            form.setData(
                                                'review_notes',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={form.errors.review_notes}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                >
                                    {form.processing && (
                                        <LoaderCircle className="animate-spin" />
                                    )}
                                    Save review
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

ApplicationShow.layout = (props: { application: Application }) => ({
    breadcrumbs: [
        { title: 'Applications', href: index() },
        {
            title: props.application.reference,
            href: show(props.application.id),
        },
    ],
});

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <dl className="grid gap-4">{children}</dl>
            </CardContent>
        </Card>
    );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="grid gap-1 sm:grid-cols-[14rem_1fr] sm:gap-4">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-sm whitespace-pre-line">{children}</dd>
        </div>
    );
}
