from rest_framework.filters import SearchFilter
from rest_framework.viewsets import ModelViewSet

from .models import Account
from .serializers import AccountSerializer


class AccountViewSet(ModelViewSet):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    filter_backends = [SearchFilter]
    search_fields = ["username", "email"]
