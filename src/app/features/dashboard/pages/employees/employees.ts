import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { UsersService, Employee, CreateEmployeePayload, UpdateEmployeePayload } from '../../../../core/services/users.service';
import { AuthService } from '../../../../core/services/auth.service';

type ModalMode = 'create' | 'edit';

type EmployeeForm = {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'employee';
};

@Component({
  selector: 'app-employees',
  imports: [FormsModule, TitleCasePipe],
  templateUrl: './employees.html',
  styleUrl: './employees.scss',
})
export class Employees implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;
  readonly employees = signal<Employee[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly showModal = signal(false);
  readonly modalMode = signal<ModalMode>('create');
  readonly selectedId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly saveError = signal('');

  readonly showDeleteConfirm = signal(false);
  readonly deleteTargetId = signal<string | null>(null);
  readonly deleteTargetName = signal('');
  readonly deleting = signal(false);

  readonly searchQuery = signal('');

  readonly filteredEmployees = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.employees();
    return this.employees().filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q),
    );
  });

  readonly employeeCount = computed(() => this.employees().filter((e) => e.role === 'employee').length);
  readonly adminCount = computed(() => this.employees().filter((e) => e.role === 'admin').length);

  form: EmployeeForm = this.emptyForm();

  ngOnInit(): void {
    this.loadEmployees();
  }

  private loadEmployees(): void {
    this.loading.set(true);
    this.error.set('');
    this.usersService.getAll().subscribe({
      next: (data) => {
        this.employees.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to load employees.');
        this.loading.set(false);
      },
    });
  }

  openCreateModal(): void {
    this.form = this.emptyForm();
    this.modalMode.set('create');
    this.selectedId.set(null);
    this.saveError.set('');
    this.showModal.set(true);
  }

  openEditModal(emp: Employee): void {
    this.form = { name: emp.name, email: emp.email, password: '', role: emp.role };
    this.modalMode.set('edit');
    this.selectedId.set(emp.id);
    this.saveError.set('');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  submitForm(): void {
    this.saving.set(true);
    this.saveError.set('');

    if (this.modalMode() === 'create') {
      const payload: CreateEmployeePayload = {
        name: this.form.name,
        email: this.form.email,
        password: this.form.password,
        role: this.form.role,
      };
      this.usersService.create(payload).subscribe({
        next: (created) => {
          this.employees.update((list) => [...list, created].sort((a, b) => a.name.localeCompare(b.name)));
          this.saving.set(false);
          this.showModal.set(false);
        },
        error: (err) => {
          this.saveError.set(err?.error?.message ?? 'Failed to create employee.');
          this.saving.set(false);
        },
      });
    } else {
      const id = this.selectedId()!;
      const payload: UpdateEmployeePayload = { name: this.form.name, role: this.form.role };
      this.usersService.update(id, payload).subscribe({
        next: (updated) => {
          this.employees.update((list) =>
            list.map((e) => (e.id === id ? updated : e)).sort((a, b) => a.name.localeCompare(b.name)),
          );
          this.saving.set(false);
          this.showModal.set(false);
        },
        error: (err) => {
          this.saveError.set(err?.error?.message ?? 'Failed to update employee.');
          this.saving.set(false);
        },
      });
    }
  }

  confirmDelete(emp: Employee): void {
    this.deleteTargetId.set(emp.id);
    this.deleteTargetName.set(emp.name);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.deleteTargetId.set(null);
  }

  executeDelete(): void {
    const id = this.deleteTargetId();
    if (!id) return;
    this.deleting.set(true);
    this.usersService.delete(id).subscribe({
      next: () => {
        this.employees.update((list) => list.filter((e) => e.id !== id));
        this.deleting.set(false);
        this.showDeleteConfirm.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to delete employee.');
        this.deleting.set(false);
        this.showDeleteConfirm.set(false);
      },
    });
  }

  isCurrentUser(id: string): boolean {
    return this.currentUser()?.id === id;
  }

  private emptyForm(): EmployeeForm {
    return { name: '', email: '', password: '', role: 'employee' };
  }
}
