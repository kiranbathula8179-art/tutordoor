from django.db.models import Count
from django.http import HttpResponse
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import ApplicationError, ResourceNotFoundError
from apps.core.pagination import StandardResultsSetPagination
from apps.core.permissions import IsPlatformAdmin
from apps.masterdata.models import MasterDataType
from apps.masterdata.repositories.master_repository import MasterDataRepository
from apps.masterdata.serializers import (
    MasterDataAuditSerializer,
    MasterDataItemAdminSerializer,
    MasterDataItemPublicSerializer,
    MasterDataItemWriteSerializer,
    MasterDataTypeSerializer,
)
from apps.masterdata.services.master_service import MasterDataService

MAX_BOOTSTRAP_TYPES = 25


# ---------------------------------------------------------------------------
# Public — what the frontend's option lists consume
# ---------------------------------------------------------------------------

class BootstrapView(APIView):
    """GET /master-data/bootstrap/?types=a,b,c — active items for several
    vocabularies in one round-trip, keyed by type code."""

    permission_classes = [AllowAny]

    def get(self, request):
        raw = request.query_params.get("types", "")
        type_codes = [code.strip() for code in raw.split(",") if code.strip()]
        if not type_codes:
            raise ApplicationError("Provide ?types=comma,separated,type_codes.")
        if len(type_codes) > MAX_BOOTSTRAP_TYPES:
            raise ApplicationError(f"At most {MAX_BOOTSTRAP_TYPES} types per bootstrap call.")

        grouped = MasterDataRepository().bootstrap_map(type_codes)
        data = {
            code: MasterDataItemPublicSerializer(items, many=True).data
            for code, items in grouped.items()
        }
        return Response({"success": True, "data": data})


class TypeItemsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, type_code):
        repository = MasterDataRepository()
        if not repository.get_type_by_code(type_code):
            raise ResourceNotFoundError(f"Unknown master data type '{type_code}'.")
        items = repository.list_active_items(type_code)
        return Response({"success": True, "results": MasterDataItemPublicSerializer(items, many=True).data})


# ---------------------------------------------------------------------------
# Admin — the Master Data Admin module's API
# ---------------------------------------------------------------------------

class AdminTypeListView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        types = MasterDataType.objects.annotate(item_count=Count("items", distinct=True)).order_by("name")
        return Response({"success": True, "results": MasterDataTypeSerializer(types, many=True).data})


class AdminItemListCreateView(APIView):
    permission_classes = [IsPlatformAdmin]
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        queryset = MasterDataRepository().list_items_admin(
            type_code=request.query_params.get("type"),
            query=request.query_params.get("q"),
            status=request.query_params.get("status"),
        )
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        return paginator.get_paginated_response(MasterDataItemAdminSerializer(page, many=True).data)

    def post(self, request):
        type_code = request.data.get("type_code") or request.query_params.get("type")
        if not type_code:
            raise ApplicationError("type_code is required.")
        serializer = MasterDataItemWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = MasterDataService().create_item(request.user, type_code=type_code, **serializer.validated_data)
        return Response(
            {"success": True, "item": MasterDataItemAdminSerializer(item).data},
            status=status.HTTP_201_CREATED,
        )


class AdminItemDetailView(APIView):
    permission_classes = [IsPlatformAdmin]

    def patch(self, request, item_id):
        serializer = MasterDataItemWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        item = MasterDataService().update_item(request.user, item_id, **serializer.validated_data)
        return Response({"success": True, "item": MasterDataItemAdminSerializer(item).data})

    def delete(self, request, item_id):
        MasterDataService().delete_item(request.user, item_id)
        return Response({"success": True, "message": "Item deleted."})


class AdminItemActivateView(APIView):
    permission_classes = [IsPlatformAdmin]

    def post(self, request, item_id):
        item = MasterDataService().set_active(request.user, item_id, active=True)
        return Response({"success": True, "item": MasterDataItemAdminSerializer(item).data})


class AdminItemDeactivateView(APIView):
    permission_classes = [IsPlatformAdmin]

    def post(self, request, item_id):
        item = MasterDataService().set_active(request.user, item_id, active=False)
        return Response({"success": True, "item": MasterDataItemAdminSerializer(item).data})


class AdminAuditListView(APIView):
    permission_classes = [IsPlatformAdmin]
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        queryset = MasterDataRepository().list_audit(type_code=request.query_params.get("type"))
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        return paginator.get_paginated_response(MasterDataAuditSerializer(page, many=True).data)


class AdminExportCsvView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        type_code = request.query_params.get("type")
        csv_text = MasterDataService().export_csv(type_code=type_code)
        filename = f"master-data-{type_code or 'all'}.csv"
        response = HttpResponse(csv_text, content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class AdminImportCsvView(APIView):
    permission_classes = [IsPlatformAdmin]

    def post(self, request):
        upload = request.FILES.get("file")
        if not upload:
            raise ApplicationError("Attach a CSV file under the 'file' field.")
        result = MasterDataService().import_csv(request.user, upload.read())
        return Response({"success": True, **result})
