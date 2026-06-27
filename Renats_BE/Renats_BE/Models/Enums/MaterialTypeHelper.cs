namespace Renats_BE.Models.Enums;

/// <summary>
/// Helper chuyển đổi MaterialType enum ↔ tên tiếng Việt để lưu vào database.
/// EF Core sẽ dùng helper này qua ValueConverter trong AppDbContext.
/// C# code vẫn dùng MaterialType.CARDBOARD bình thường;
/// Database lưu "Giấy Carton" thay vì "CARDBOARD".
/// </summary>
public static class MaterialTypeHelper
{
    // Bảng ánh xạ: enum → tiếng Việt (lưu vào DB)
    private static readonly Dictionary<MaterialType, string> _toVN = new()
    {
        { MaterialType.CARDBOARD,       "Giấy Carton"        },
        { MaterialType.PAPER,           "Giấy thải báo"      },
        { MaterialType.IRON,            "Sắt vụn"            },
        { MaterialType.STEEL,           "Thép phế liệu"      },
        { MaterialType.COPPER,          "Đồng cáp"           },
        { MaterialType.ALUMINUM,        "Nhôm phế liệu"      },
        { MaterialType.LEAD,            "Chì / Ắc quy"       },
        { MaterialType.PET,             "Nhựa PET"           },
        { MaterialType.HDPE,            "Nhựa HDPE"          },
        { MaterialType.PP,              "Nhựa PP"            },
        { MaterialType.PVC,             "Nhựa cứng (PVC)"    },
        { MaterialType.BATTERY,         "Pin Lithium"        },
        { MaterialType.ELECTRONIC_WASTE,"Điện tử / Linh kiện"},
        { MaterialType.RUBBER,          "Cao su phế liệu"    },
        { MaterialType.OIL,             "Dầu nhớt thải"      },
        { MaterialType.OTHER,           "Khác"               },
    };

    // Bảng ngược: tiếng Việt → enum (đọc từ DB)
    private static readonly Dictionary<string, MaterialType> _fromVN =
        _toVN.ToDictionary(kvp => kvp.Value, kvp => kvp.Key,
                           StringComparer.OrdinalIgnoreCase);

    /// <summary>Chuyển enum sang tên tiếng Việt để ghi vào DB.</summary>
    public static string ToVietnamese(MaterialType type)
        => _toVN.TryGetValue(type, out var vn) ? vn : type.ToString();

    /// <summary>
    /// Đọc chuỗi từ DB và chuyển về enum.
    /// Hỗ trợ cả giá trị tiếng Việt mới ("Giấy Carton")
    /// lẫn giá trị enum cũ ("CARDBOARD") để tương thích ngược.
    /// </summary>
    public static MaterialType FromString(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return MaterialType.OTHER;

        // Thử ánh xạ tiếng Việt trước
        if (_fromVN.TryGetValue(value, out var fromVN)) return fromVN;

        // Tương thích ngược: nếu DB vẫn còn giá trị enum cũ (CARDBOARD, PAPER...)
        if (Enum.TryParse<MaterialType>(value, ignoreCase: true, out var parsed)) return parsed;

        return MaterialType.OTHER;
    }

    /// <summary>Lấy tên tiếng Việt từ chuỗi DB (dùng trong các controller để hiển thị).</summary>
    public static string GetLabel(string? dbValue)
    {
        if (string.IsNullOrWhiteSpace(dbValue)) return "Khác";
        var type = FromString(dbValue);
        return _toVN.TryGetValue(type, out var label) ? label : dbValue;
    }
}
