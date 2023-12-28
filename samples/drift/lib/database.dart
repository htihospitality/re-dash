import 'package:drift/drift.dart';

import 'connection/connection.dart' as impl;

part 'database.g.dart';

class AppState extends Table {
  IntColumn get id => integer().autoIncrement()();
  IntColumn get width => integer().nullable()();
  IntColumn get length => integer().nullable()();
  IntColumn get area => integer().nullable()();
  BoolColumn get killSwitch => boolean().nullable()();
}

@DriftDatabase(tables: [AppState])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(impl.connect());

  @override
  int get schemaVersion => 1;
}
