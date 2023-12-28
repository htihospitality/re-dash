// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'database.dart';

// ignore_for_file: type=lint
class $AppStateTable extends AppState
    with TableInfo<$AppStateTable, AppStateData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $AppStateTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      hasAutoIncrement: true,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('PRIMARY KEY AUTOINCREMENT'));
  static const VerificationMeta _widthMeta = const VerificationMeta('width');
  @override
  late final GeneratedColumn<int> width = GeneratedColumn<int>(
      'width', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _lengthMeta = const VerificationMeta('length');
  @override
  late final GeneratedColumn<int> length = GeneratedColumn<int>(
      'length', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _areaMeta = const VerificationMeta('area');
  @override
  late final GeneratedColumn<int> area = GeneratedColumn<int>(
      'area', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _killSwitchMeta =
      const VerificationMeta('killSwitch');
  @override
  late final GeneratedColumn<bool> killSwitch = GeneratedColumn<bool>(
      'kill_switch', aliasedName, true,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints: GeneratedColumn.constraintIsAlways(
          'CHECK ("kill_switch" IN (0, 1))'));
  @override
  List<GeneratedColumn> get $columns => [id, width, length, area, killSwitch];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'app_state';
  @override
  VerificationContext validateIntegrity(Insertable<AppStateData> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('width')) {
      context.handle(
          _widthMeta, width.isAcceptableOrUnknown(data['width']!, _widthMeta));
    }
    if (data.containsKey('length')) {
      context.handle(_lengthMeta,
          length.isAcceptableOrUnknown(data['length']!, _lengthMeta));
    }
    if (data.containsKey('area')) {
      context.handle(
          _areaMeta, area.isAcceptableOrUnknown(data['area']!, _areaMeta));
    }
    if (data.containsKey('kill_switch')) {
      context.handle(
          _killSwitchMeta,
          killSwitch.isAcceptableOrUnknown(
              data['kill_switch']!, _killSwitchMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  AppStateData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return AppStateData(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      width: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}width']),
      length: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}length']),
      area: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}area']),
      killSwitch: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}kill_switch']),
    );
  }

  @override
  $AppStateTable createAlias(String alias) {
    return $AppStateTable(attachedDatabase, alias);
  }
}

class AppStateData extends DataClass implements Insertable<AppStateData> {
  final int id;
  final int? width;
  final int? length;
  final int? area;
  final bool? killSwitch;
  const AppStateData(
      {required this.id, this.width, this.length, this.area, this.killSwitch});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    if (!nullToAbsent || width != null) {
      map['width'] = Variable<int>(width);
    }
    if (!nullToAbsent || length != null) {
      map['length'] = Variable<int>(length);
    }
    if (!nullToAbsent || area != null) {
      map['area'] = Variable<int>(area);
    }
    if (!nullToAbsent || killSwitch != null) {
      map['kill_switch'] = Variable<bool>(killSwitch);
    }
    return map;
  }

  AppStateCompanion toCompanion(bool nullToAbsent) {
    return AppStateCompanion(
      id: Value(id),
      width:
          width == null && nullToAbsent ? const Value.absent() : Value(width),
      length:
          length == null && nullToAbsent ? const Value.absent() : Value(length),
      area: area == null && nullToAbsent ? const Value.absent() : Value(area),
      killSwitch: killSwitch == null && nullToAbsent
          ? const Value.absent()
          : Value(killSwitch),
    );
  }

  factory AppStateData.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return AppStateData(
      id: serializer.fromJson<int>(json['id']),
      width: serializer.fromJson<int?>(json['width']),
      length: serializer.fromJson<int?>(json['length']),
      area: serializer.fromJson<int?>(json['area']),
      killSwitch: serializer.fromJson<bool?>(json['killSwitch']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'width': serializer.toJson<int?>(width),
      'length': serializer.toJson<int?>(length),
      'area': serializer.toJson<int?>(area),
      'killSwitch': serializer.toJson<bool?>(killSwitch),
    };
  }

  AppStateData copyWith(
          {int? id,
          Value<int?> width = const Value.absent(),
          Value<int?> length = const Value.absent(),
          Value<int?> area = const Value.absent(),
          Value<bool?> killSwitch = const Value.absent()}) =>
      AppStateData(
        id: id ?? this.id,
        width: width.present ? width.value : this.width,
        length: length.present ? length.value : this.length,
        area: area.present ? area.value : this.area,
        killSwitch: killSwitch.present ? killSwitch.value : this.killSwitch,
      );
  @override
  String toString() {
    return (StringBuffer('AppStateData(')
          ..write('id: $id, ')
          ..write('width: $width, ')
          ..write('length: $length, ')
          ..write('area: $area, ')
          ..write('killSwitch: $killSwitch')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, width, length, area, killSwitch);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is AppStateData &&
          other.id == this.id &&
          other.width == this.width &&
          other.length == this.length &&
          other.area == this.area &&
          other.killSwitch == this.killSwitch);
}

class AppStateCompanion extends UpdateCompanion<AppStateData> {
  final Value<int> id;
  final Value<int?> width;
  final Value<int?> length;
  final Value<int?> area;
  final Value<bool?> killSwitch;
  const AppStateCompanion({
    this.id = const Value.absent(),
    this.width = const Value.absent(),
    this.length = const Value.absent(),
    this.area = const Value.absent(),
    this.killSwitch = const Value.absent(),
  });
  AppStateCompanion.insert({
    this.id = const Value.absent(),
    this.width = const Value.absent(),
    this.length = const Value.absent(),
    this.area = const Value.absent(),
    this.killSwitch = const Value.absent(),
  });
  static Insertable<AppStateData> custom({
    Expression<int>? id,
    Expression<int>? width,
    Expression<int>? length,
    Expression<int>? area,
    Expression<bool>? killSwitch,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (width != null) 'width': width,
      if (length != null) 'length': length,
      if (area != null) 'area': area,
      if (killSwitch != null) 'kill_switch': killSwitch,
    });
  }

  AppStateCompanion copyWith(
      {Value<int>? id,
      Value<int?>? width,
      Value<int?>? length,
      Value<int?>? area,
      Value<bool?>? killSwitch}) {
    return AppStateCompanion(
      id: id ?? this.id,
      width: width ?? this.width,
      length: length ?? this.length,
      area: area ?? this.area,
      killSwitch: killSwitch ?? this.killSwitch,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (width.present) {
      map['width'] = Variable<int>(width.value);
    }
    if (length.present) {
      map['length'] = Variable<int>(length.value);
    }
    if (area.present) {
      map['area'] = Variable<int>(area.value);
    }
    if (killSwitch.present) {
      map['kill_switch'] = Variable<bool>(killSwitch.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('AppStateCompanion(')
          ..write('id: $id, ')
          ..write('width: $width, ')
          ..write('length: $length, ')
          ..write('area: $area, ')
          ..write('killSwitch: $killSwitch')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  late final $AppStateTable appState = $AppStateTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [appState];
}
