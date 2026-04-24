"use client";

import { use } from "react";
import TrabalhoForm from "@/app/components/trabalhos/TrabalhoForm";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/Card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";

export default function EditarTrabalhoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <ProtectedRoute>
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
              <CardTitle>Editar Trabalho</CardTitle>
            </CardHeader>
            <CardContent>
              <TrabalhoForm trabalhoId={id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
