"use client";

import TrabalhoForm from "@/app/components/trabalhos/TrabalhoForm";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/Card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";

export default function CadastrarTrabalhoPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Link href="/trabalhos">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Trabalhos
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Cadastrar Novo Trabalho</CardTitle>
          </CardHeader>
          <CardContent>
            <TrabalhoForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
