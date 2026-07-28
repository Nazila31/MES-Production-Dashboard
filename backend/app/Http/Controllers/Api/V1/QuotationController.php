<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\QuotationStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Quotation;
use App\Services\ActivityLogService;
use App\Services\MesNotificationService;
use App\Support\MesFileRules;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class QuotationController extends Controller
{
    public function __construct(
        private MesNotificationService $notifications,
        private ActivityLogService $activities,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Quotation::query()->latest();

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($builder) use ($search) {
                $builder->where('quotation_number', 'like', "%{$search}%")
                    ->orWhere('client', 'like', "%{$search}%");
            });
        }

        $paginated = $query->paginate($request->integer('per_page', 15));

        return response()->json([
            'data' => $paginated->getCollection()->map(fn (Quotation $q) => $this->transform($q)),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    public function show(Quotation $quotation): JsonResponse
    {
        return response()->json(['data' => $this->transform($quotation)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'quotation_number' => ['required', 'string', 'max:50', 'unique:quotations,quotation_number'],
            'client' => ['required', 'string', 'max:255'],
            'pic' => ['nullable', 'string', 'max:255'],
            'machine' => ['nullable', 'string', 'max:255'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'deadline' => ['nullable', 'date'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'in:draft,sent'],
            'file' => MesFileRules::document(),
        ]);

        $fileMeta = $this->storeFile($request, 'quotations');

        $quotation = Quotation::create([
            'quotation_number' => $data['quotation_number'],
            'client' => $data['client'],
            'pic' => $data['pic'] ?? null,
            'machine' => $data['machine'] ?? null,
            'amount' => $data['amount'] ?? 0,
            'deadline' => $data['deadline'] ?? null,
            'description' => $data['description'] ?? null,
            'status' => $data['status'] ?? QuotationStatus::Draft,
            'created_by' => $request->user()->id,
            ...$fileMeta,
        ]);

        $this->activities->log(
            "Quotation {$quotation->quotation_number} created.",
            'marketing',
            $request->user(),
            $quotation,
        );

        return response()->json([
            'data' => $this->transform($quotation),
            'message' => 'Quotation created successfully.',
        ], 201);
    }

    public function update(Request $request, Quotation $quotation): JsonResponse
    {
        if (in_array($quotation->status, [QuotationStatus::Approved, QuotationStatus::Rejected], true)) {
            return response()->json(['message' => 'Approved or rejected quotations cannot be edited.'], 422);
        }

        $data = $request->validate([
            'quotation_number' => ['sometimes', 'required', 'string', 'max:50', 'unique:quotations,quotation_number,'.$quotation->id],
            'client' => ['sometimes', 'required', 'string', 'max:255'],
            'pic' => ['nullable', 'string', 'max:255'],
            'machine' => ['nullable', 'string', 'max:255'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'deadline' => ['nullable', 'date'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'in:draft,sent'],
            'file' => MesFileRules::document(),
        ]);

        if ($request->hasFile('file')) {
            if ($quotation->file_path) {
                Storage::disk('public')->delete($quotation->file_path);
            }
            $quotation->fill($this->storeFile($request, 'quotations'));
        }

        $quotation->fill(collect($data)->except('file')->all());
        $quotation->save();

        return response()->json([
            'data' => $this->transform($quotation->fresh()),
            'message' => 'Quotation updated successfully.',
        ]);
    }

    public function destroy(Quotation $quotation): JsonResponse
    {
        if ($quotation->salesOrder) {
            return response()->json(['message' => 'Cannot delete quotation linked to a sales order.'], 422);
        }

        if ($quotation->file_path) {
            Storage::disk('public')->delete($quotation->file_path);
        }

        $quotation->delete();

        return response()->json(['message' => 'Quotation deleted successfully.']);
    }

    public function approve(Request $request, Quotation $quotation): JsonResponse
    {
        if ($quotation->status !== QuotationStatus::Draft && $quotation->status !== QuotationStatus::Sent) {
            return response()->json(['message' => 'Only draft or sent quotations can be approved.'], 422);
        }

        $quotation->update([
            'status' => QuotationStatus::Approved,
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        $this->notifications->notifyAdmins(
            'quotation_approved',
            'Quotation Approved',
            "Quotation {$quotation->quotation_number} has been approved and is ready for Sales Order creation.",
            $quotation,
        );

        $this->activities->log(
            "Quotation {$quotation->quotation_number} approved.",
            'marketing',
            $request->user(),
            $quotation,
        );

        return response()->json([
            'data' => $this->transform($quotation->fresh()),
            'message' => 'Quotation approved.',
        ]);
    }

    public function reject(Request $request, Quotation $quotation): JsonResponse
    {
        if ($quotation->status !== QuotationStatus::Draft && $quotation->status !== QuotationStatus::Sent) {
            return response()->json(['message' => 'Only draft or sent quotations can be rejected.'], 422);
        }

        $quotation->update(['status' => QuotationStatus::Rejected]);

        $this->activities->log(
            "Quotation {$quotation->quotation_number} rejected.",
            'marketing',
            $request->user(),
            $quotation,
        );

        return response()->json([
            'data' => $this->transform($quotation->fresh()),
            'message' => 'Quotation rejected.',
        ]);
    }

    public function approvedForSo(): JsonResponse
    {
        $data = Quotation::query()
            ->where('status', QuotationStatus::Approved)
            ->whereDoesntHave('salesOrder')
            ->latest()
            ->get()
            ->map(fn (Quotation $q) => $this->transform($q));

        return response()->json(['data' => $data]);
    }

    public function preview(Quotation $quotation): JsonResponse
    {
        if (! $quotation->file_path) {
            return response()->json(['message' => 'No document uploaded.'], 404);
        }

        return response()->json([
            'data' => [
                'url' => Storage::disk('public')->url($quotation->file_path),
                'file_name' => $quotation->file_name,
                'mime' => $quotation->file_mime,
            ],
        ]);
    }

    private function storeFile(Request $request, string $folder): array
    {
        if (! $request->hasFile('file')) {
            return [];
        }

        $file = $request->file('file');
        $path = $file->store($folder, 'public');

        return [
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'file_mime' => $file->getClientMimeType(),
        ];
    }

    private function transform(Quotation $quotation): array
    {
        return [
            'id' => $quotation->id,
            'quotation_number' => $quotation->quotation_number,
            'client' => $quotation->client,
            'pic' => $quotation->pic,
            'machine' => $quotation->machine,
            'amount' => (float) $quotation->amount,
            'status' => $quotation->status->value,
            'description' => $quotation->description,
            'deadline' => optional($quotation->deadline)?->format('Y-m-d'),
            'created_at' => $quotation->created_at?->format('Y-m-d'),
            'file_name' => $quotation->file_name,
            'file_url' => $quotation->file_path ? Storage::disk('public')->url($quotation->file_path) : null,
            'has_file' => (bool) $quotation->file_path,
        ];
    }
}
