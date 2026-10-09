import asyncio

from app.db.seed import reset_demo_data
from app.db.session import AsyncSessionLocal


async def _run_seed() -> None:
    async with AsyncSessionLocal() as session:
        await reset_demo_data(session)


def main() -> None:
    asyncio.run(_run_seed())
    print("Demo data seeded.")


if __name__ == "__main__":
    main()