-- DropForeignKey
ALTER TABLE "Designation" DROP CONSTRAINT "Designation_createdById_fkey";

-- AlterTable
ALTER TABLE "Designation" DROP COLUMN "createdById",
ADD COLUMN     "createdById" UUID NOT NULL;

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "Profile" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'REPARTITEUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");

-- AddForeignKey
ALTER TABLE "Designation" ADD CONSTRAINT "Designation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Profile.id référence auth.users.id (schéma géré par Supabase, volontairement
-- hors du datasource Prisma pour éviter le "drift" documenté par Supabase).
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_id_fkey" FOREIGN KEY ("id") REFERENCES auth.users(id) ON DELETE CASCADE;

-- Provisioning automatique d'un Profile à l'inscription d'un utilisateur Supabase Auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public."Profile" (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'REPARTITEUR'
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
