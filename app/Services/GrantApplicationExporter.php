<?php

namespace App\Services;

use App\Models\GrantApplication;
use Carbon\CarbonImmutable;
use Closure;
use OpenSpout\Common\Entity\Cell;
use OpenSpout\Common\Entity\Cell\DateTimeCell;
use OpenSpout\Common\Entity\Cell\EmptyCell;
use OpenSpout\Common\Entity\Cell\NumericCell;
use OpenSpout\Common\Entity\Cell\StringCell;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Writer\AutoFilter;
use OpenSpout\Writer\Common\Entity\Sheet;
use OpenSpout\Writer\XLSX\Entity\SheetView;
use OpenSpout\Writer\XLSX\Options;
use OpenSpout\Writer\XLSX\Writer;
use Throwable;

class GrantApplicationExporter
{
    private const string DATE_FORMAT = 'yyyy-mm-dd';

    private const string TIMESTAMP_FORMAT = 'yyyy-mm-dd hh:mm';

    private const float COLUMN_WIDTH = 24;

    /**
     * Write the applications to a temporary Excel workbook and return its path.
     *
     * @param  iterable<GrantApplication>  $applications
     */
    public function export(iterable $applications): string
    {
        $path = tempnam(sys_get_temp_dir(), 'applications');
        $writer = new Writer(new Options(DEFAULT_COLUMN_WIDTH: self::COLUMN_WIDTH));

        try {
            $writer->openToFile($path);

            $budgetRows = $this->writeApplicationsSheet($writer, $applications);
            $this->writeBudgetSheet($writer, $budgetRows);

            $writer->close();
        } catch (Throwable $exception) {
            $writer->close();
            unlink($path);

            throw $exception;
        }

        return $path;
    }

    /**
     * Write one row per application and return the budget item rows for the next sheet.
     *
     * @param  iterable<GrantApplication>  $applications
     * @return list<Row>
     */
    private function writeApplicationsSheet(Writer $writer, iterable $applications): array
    {
        $budgetRows = [];
        $columns = $this->columns();

        $sheet = $writer->getCurrentSheet();
        $sheet->setName('Applications');
        $writer->addRow($this->headerRow(array_keys($columns)));

        foreach ($applications as $application) {
            $writer->addRow(new Row(array_map(
                fn (Closure $value): Cell => $this->cell($value($application)),
                array_values($columns),
            )));

            foreach ($application->budget_items as $item) {
                $budgetRows[] = new Row(array_map($this->cell(...), [
                    $application->reference,
                    $application->full_name,
                    $application->business_name,
                    $item['description'],
                    $item['quantity'],
                    (int) $item['amount'],
                ]));
            }
        }

        $this->finishSheet($sheet, count($columns));

        return $budgetRows;
    }

    /**
     * Write one row per budget item so amounts can be summed in Excel.
     *
     * @param  list<Row>  $budgetRows
     */
    private function writeBudgetSheet(Writer $writer, array $budgetRows): void
    {
        $headers = ['Ref.', 'Applicant', 'Business', 'Description', 'Quantity', 'Amount (RWF)'];

        $sheet = $writer->addNewSheetAndMakeItCurrent();
        $sheet->setName('Budget items');
        $writer->addRow($this->headerRow($headers));
        $writer->addRows($budgetRows);

        $this->finishSheet($sheet, count($headers));
    }

    /**
     * Keep the header row visible while scrolling and let administrators filter each column.
     *
     * @param  positive-int  $columnCount
     */
    private function finishSheet(Sheet $sheet, int $columnCount): void
    {
        $sheet->setSheetView((new SheetView)->withFreezeRow(2));
        $sheet->setAutoFilter(new AutoFilter(0, 1, $columnCount - 1, max(1, $sheet->getWrittenRowCount())));
    }

    /**
     * The applications sheet's columns, as heading => value.
     *
     * @return non-empty-array<string, Closure(GrantApplication): mixed>
     */
    private function columns(): array
    {
        return [
            'Ref.' => fn (GrantApplication $application): string => $application->reference,
            'Submitted (Kigali time)' => fn (GrantApplication $application): ?CarbonImmutable => $application->created_at,
            'Score' => fn (GrantApplication $application): int => $application->score,
            'Qualification' => fn (GrantApplication $application): string => $application->qualification->label(),
            'Status' => fn (GrantApplication $application): string => $application->status->label(),

            'Full name' => fn (GrantApplication $application): string => $application->full_name,
            'Date of birth' => fn (GrantApplication $application): Cell => new DateTimeCell($application->date_of_birth, new Style(format: self::DATE_FORMAT)),
            'Age' => fn (GrantApplication $application): int => $application->age,
            'National ID' => fn (GrantApplication $application): string => $application->national_id,
            'Phone' => fn (GrantApplication $application): string => $application->phone,
            'Email' => fn (GrantApplication $application): ?string => $application->email,
            'Province' => fn (GrantApplication $application): string => $application->province->label(),
            'District' => fn (GrantApplication $application): string => $application->district,
            'Sector' => fn (GrantApplication $application): string => $application->sector,
            'Cell' => fn (GrantApplication $application): string => $application->cell,
            'Village' => fn (GrantApplication $application): string => $application->village,

            'Team application' => fn (GrantApplication $application): bool => $application->is_team,
            'Team representative' => fn (GrantApplication $application): ?string => $application->team_representative_name,
            'Team members' => fn (GrantApplication $application): ?int => $application->team_members_count,
            'Women in team' => fn (GrantApplication $application): ?int => $application->team_women_count,

            'Rwandan woman / team ≥50% women' => fn (GrantApplication $application): bool => $application->is_woman_led,
            'At least 18 years old' => fn (GrantApplication $application): bool => $application->is_adult,
            'Business operating ≥ 1 year' => fn (GrantApplication $application): bool => $application->has_operated_one_year,
            'Business is main daily work' => fn (GrantApplication $application): bool => $application->is_main_occupation,
            'Would continue without the grant' => fn (GrantApplication $application): bool => $application->can_continue_without_grant,
            'Employs / will employ others' => fn (GrantApplication $application): bool => $application->creates_jobs,

            'Highest education' => fn (GrantApplication $application): string => $application->education_level->adminLabel(),
            'Highest education (other)' => fn (GrantApplication $application): ?string => $application->education_level_other,
            'Related training / certificate' => fn (GrantApplication $application): bool => $application->has_related_training,
            'Training details' => fn (GrantApplication $application): ?string => $application->related_training_details,
            'Previous / parallel work' => fn (GrantApplication $application): string => $application->previous_work,
            'Previous grant or support' => fn (GrantApplication $application): bool => $application->received_previous_support,
            'Support details' => fn (GrantApplication $application): ?string => $application->previous_support_details,
            'Land, equipment or assets' => fn (GrantApplication $application): bool => $application->has_assets,
            'Asset details' => fn (GrantApplication $application): ?string => $application->assets_details,
            'Why they need the grant' => fn (GrantApplication $application): string => $application->grant_need,
            'Expected impact on life & family' => fn (GrantApplication $application): string => $application->expected_impact,

            'Business name' => fn (GrantApplication $application): string => $application->business_name,
            'Business sector' => fn (GrantApplication $application): string => $application->industry->adminLabel(),
            'Business sector (other)' => fn (GrantApplication $application): ?string => $application->industry_other,
            'Years operating' => fn (GrantApplication $application): int => $application->business_years_operating,
            'Business district' => fn (GrantApplication $application): string => $application->business_district,
            'Business location sector' => fn (GrantApplication $application): string => $application->business_sector,
            'Summary and main goals' => fn (GrantApplication $application): string => $application->business_summary,
            'New jobs planned' => fn (GrantApplication $application): int => $application->planned_jobs,
            'New jobs for women' => fn (GrantApplication $application): int => $application->planned_jobs_for_women,
            'Budget total (RWF)' => fn (GrantApplication $application): int => $application->budget_total,

            'Committed to submit business plan' => fn (GrantApplication $application): bool => $application->will_submit_business_plan,
            'Signed as' => fn (GrantApplication $application): string => $application->signature_name,

            'Business plan received (Kigali time)' => fn (GrantApplication $application): ?CarbonImmutable => $application->business_plan_received_at,
            'Review notes' => fn (GrantApplication $application): ?string => $application->review_notes,
            'Reviewed by' => fn (GrantApplication $application): ?string => $application->reviewer?->name,
            'Reviewed (Kigali time)' => fn (GrantApplication $application): ?CarbonImmutable => $application->reviewed_at,
        ];
    }

    /**
     * Build a bold header row.
     *
     * @param  list<string>  $headers
     */
    private function headerRow(array $headers): Row
    {
        return Row::fromValuesWithStyle($headers, new Style(fontBold: true));
    }

    /**
     * Build a cell of the right type for a value.
     *
     * Strings always become string cells, because applicants write this text on a
     * public form and Cell::fromValue() would run anything starting with "=" as a formula.
     */
    private function cell(mixed $value): Cell
    {
        return match (true) {
            $value instanceof Cell => $value,
            $value === null, $value === '' => new EmptyCell(null),
            is_bool($value) => new StringCell($value ? 'Yes' : 'No'),
            is_int($value) => new NumericCell($value),
            $value instanceof CarbonImmutable => new DateTimeCell(
                $value->setTimezone(config('fondo.timezone')),
                new Style(format: self::TIMESTAMP_FORMAT),
            ),
            default => new StringCell((string) $value),
        };
    }
}
