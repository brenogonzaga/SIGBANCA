"use client";

import BancaForm from "@/app/components/bancas/BancaForm";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/Card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";

export default function CadastrarBancaPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Link href="/bancas">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Bancas
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Cadastrar Nova Banca</CardTitle>
          </CardHeader>
          <CardContent>
            <BancaForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
