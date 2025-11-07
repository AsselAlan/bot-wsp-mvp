'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Edit, Loader2, AlertCircle } from 'lucide-react';
import { MiniTask } from '@/types';

export function MiniTasksList() {
  const [tasks, setTasks] = useState<MiniTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MiniTask | null>(null);

  // Form state
  const [triggerKeyword, setTriggerKeyword] = useState('');
  const [responseText, setResponseText] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [priority, setPriority] = useState(0);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/bot/mini-tasks');
      const result = await response.json();

      if (result.success) {
        setTasks(result.data || []);
      }
    } catch (err) {
      setError('Error al cargar mini tareas');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTriggerKeyword('');
    setResponseText('');
    setIsActive(true);
    setPriority(0);
    setEditingTask(null);
  };

  const handleOpenDialog = (task?: MiniTask) => {
    if (task) {
      setEditingTask(task);
      setTriggerKeyword(task.trigger_keyword);
      setResponseText(task.response_text);
      setIsActive(task.is_active);
      setPriority(task.priority);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const taskData = {
        trigger_keyword: triggerKeyword,
        response_text: responseText,
        is_active: isActive,
        priority
      };

      const response = await fetch('/api/bot/mini-tasks', {
        method: editingTask ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTask ? { ...taskData, id: editingTask.id } : taskData)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error al guardar');
      }

      await loadTasks();
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta mini tarea?')) {
      return;
    }

    try {
      const response = await fetch(`/api/bot/mini-tasks?id=${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error al eliminar');
      }

      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleToggleActive = async (task: MiniTask) => {
    try {
      const response = await fetch('/api/bot/mini-tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: task.id,
          is_active: !task.is_active
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error al actualizar');
      }

      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Mini Tareas</h3>
          <p className="text-sm text-muted-foreground">
            {tasks.length} tarea{tasks.length !== 1 ? 's' : ''} configurada{tasks.length !== 1 ? 's' : ''}
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSave}>
              <DialogHeader>
                <DialogTitle>
                  {editingTask ? 'Editar' : 'Nueva'} Mini Tarea
                </DialogTitle>
                <DialogDescription>
                  Configura una respuesta automática basada en palabra clave
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="trigger">Palabra Clave</Label>
                  <Input
                    id="trigger"
                    value={triggerKeyword}
                    onChange={(e) => setTriggerKeyword(e.target.value)}
                    placeholder="horario, ubicación, precio..."
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Cuando el mensaje contenga esta palabra, se enviará la respuesta automática
                  </p>
                </div>

                <div>
                  <Label htmlFor="response">Respuesta</Label>
                  <Textarea
                    id="response"
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Nuestro horario es..."
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="priority">Prioridad</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value))}
                    min={0}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Mayor prioridad se ejecuta primero (0 = menor prioridad)
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="active">Activa</Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Guardar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <p className="text-muted-foreground mb-4">No hay mini tareas configuradas</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Tarea
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Palabra Clave</TableHead>
                <TableHead>Respuesta</TableHead>
                <TableHead className="w-24">Prioridad</TableHead>
                <TableHead className="w-24">Estado</TableHead>
                <TableHead className="w-32">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.trigger_keyword}</TableCell>
                  <TableCell className="max-w-md truncate">{task.response_text}</TableCell>
                  <TableCell>{task.priority}</TableCell>
                  <TableCell>
                    <Switch
                      checked={task.is_active}
                      onCheckedChange={() => handleToggleActive(task)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(task)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
