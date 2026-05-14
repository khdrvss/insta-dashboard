from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

# Free tier: 10 req/min | Pro tier: 60 req/min
FREE_LIMIT = "10/minute"
PRO_LIMIT = "60/minute"
