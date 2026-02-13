-- Phone as primary identifier: unique constraint for login/lookup
-- Ghana format: 0XXXXXXXXX (no +233). PostgreSQL UNIQUE allows multiple NULLs.
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
