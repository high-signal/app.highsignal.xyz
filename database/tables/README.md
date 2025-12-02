# How to import a table manually between environments

E.g. you create a table in dev and want to import it to staging then prod

- Step 1:
    - Look at the `Definition` of the table in the Supabase UI and copy it
- Step 2:
    - Use the SQL editor to create that table using that copied SQL on the new environment
- Step 3:
    - Run these commands to give the correct permissions to the service user for the table

```sql
grant select, insert, update, delete on table public.<TABLE_NAME_1> to service_role;
grant select, insert, update, delete on table public.<TABLE_NAME_2> to service_role;
grant usage, select on all sequences in schema public to service_role;
```
