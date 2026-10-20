export type ListeningWord = { text: string; start: number; end: number };
export type ListeningTurn = { translation?: string; group?: string; speaker: "narrator" | "man" | "woman"; start: number; end: number; words: ListeningWord[] };
// Phrase boundaries follow the recording; word timings are estimated within voiced portions.
export const listeningTurns: ListeningTurn[] = [
  {
    "speaker": "narrator",
    "start": 0.775,
    "end": 10.31,
    "words": [
      {
        "text": "Bài",
        "start": 0.785,
        "end": 1.045
      },
      {
        "text": "5.",
        "start": 1.045,
        "end": 1.314
      },
      {
        "text": "4.2.",
        "start": 2.576,
        "end": 3.36
      },
      {
        "text": "Vợ",
        "start": 4.597,
        "end": 4.807
      },
      {
        "text": "chồng",
        "start": 4.807,
        "end": 5.097
      },
      {
        "text": "Tân",
        "start": 5.097,
        "end": 5.407
      },
      {
        "text": "bàn",
        "start": 5.407,
        "end": 5.617
      },
      {
        "text": "chuyện",
        "start": 5.617,
        "end": 5.927
      },
      {
        "text": "đi",
        "start": 5.927,
        "end": 6.137
      },
      {
        "text": "Vũng",
        "start": 6.167,
        "end": 6.447
      },
      {
        "text": "Tàu",
        "start": 6.447,
        "end": 6.667
      },
      {
        "text": "nghỉ",
        "start": 6.667,
        "end": 6.877
      },
      {
        "text": "mát,",
        "start": 6.877,
        "end": 7.093
      },
      {
        "text": "nghe",
        "start": 7.911,
        "end": 8.121
      },
      {
        "text": "hội",
        "start": 8.121,
        "end": 8.371
      },
      {
        "text": "thoại",
        "start": 8.371,
        "end": 8.591
      },
      {
        "text": "giữa",
        "start": 8.591,
        "end": 8.811
      },
      {
        "text": "họ",
        "start": 8.811,
        "end": 9.031
      },
      {
        "text": "và",
        "start": 9.031,
        "end": 9.241
      },
      {
        "text": "trả",
        "start": 9.241,
        "end": 9.561
      },
      {
        "text": "lời",
        "start": 9.561,
        "end": 9.781
      },
      {
        "text": "câu",
        "start": 9.781,
        "end": 10.091
      },
      {
        "text": "hỏi.",
        "start": 10.091,
        "end": 10.31
      }
    ]
  },
  {
    "speaker": "man",
    "start": 12.793,
    "end": 16.746,
    "words": [
      {
        "text": "Nóng",
        "start": 12.793,
        "end": 13.273
      },
      {
        "text": "quá!",
        "start": 13.273,
        "end": 13.688
      },
      {
        "text": "Tuần",
        "start": 14.305,
        "end": 14.535
      },
      {
        "text": "sau",
        "start": 14.535,
        "end": 14.765
      },
      {
        "text": "mình",
        "start": 14.765,
        "end": 14.995
      },
      {
        "text": "đi",
        "start": 14.995,
        "end": 15.235
      },
      {
        "text": "Vũng",
        "start": 15.235,
        "end": 15.465
      },
      {
        "text": "Tàu",
        "start": 15.465,
        "end": 15.755
      },
      {
        "text": "nghỉ",
        "start": 15.755,
        "end": 15.995
      },
      {
        "text": "mát",
        "start": 15.995,
        "end": 16.225
      },
      {
        "text": "đi",
        "start": 16.225,
        "end": 16.455
      },
      {
        "text": "em!",
        "start": 16.455,
        "end": 16.746
      }
    ]
  },
  {
    "speaker": "woman",
    "start": 17.764,
    "end": 22.744,
    "words": [
      {
        "text": "Vâng!",
        "start": 17.764,
        "end": 17.984
      },
      {
        "text": "Cũng",
        "start": 17.984,
        "end": 18.314
      },
      {
        "text": "lâu",
        "start": 18.314,
        "end": 18.544
      },
      {
        "text": "rồi",
        "start": 18.544,
        "end": 18.774
      },
      {
        "text": "chúng",
        "start": 18.774,
        "end": 19.084
      },
      {
        "text": "ta",
        "start": 19.084,
        "end": 19.354
      },
      {
        "text": "chưa",
        "start": 19.354,
        "end": 19.704
      },
      {
        "text": "đi",
        "start": 19.704,
        "end": 19.934
      },
      {
        "text": "Vũng",
        "start": 19.934,
        "end": 20.224
      },
      {
        "text": "Tàu.",
        "start": 20.224,
        "end": 20.454
      },
      {
        "text": "Thế",
        "start": 21.486,
        "end": 21.696
      },
      {
        "text": "anh",
        "start": 21.696,
        "end": 21.906
      },
      {
        "text": "định",
        "start": 21.906,
        "end": 22.116
      },
      {
        "text": "đi",
        "start": 22.116,
        "end": 22.326
      },
      {
        "text": "ngày",
        "start": 22.326,
        "end": 22.536
      },
      {
        "text": "nào?",
        "start": 22.536,
        "end": 22.744
      }
    ]
  },
  {
    "speaker": "man",
    "start": 23.835,
    "end": 31.013,
    "words": [
      {
        "text": "Trưa",
        "start": 23.855,
        "end": 24.225
      },
      {
        "text": "thứ",
        "start": 24.225,
        "end": 24.575
      },
      {
        "text": "Bảy",
        "start": 24.575,
        "end": 25.045
      },
      {
        "text": "đi,",
        "start": 25.045,
        "end": 25.415
      },
      {
        "text": "chiều",
        "start": 25.415,
        "end": 25.765
      },
      {
        "text": "Chủ",
        "start": 25.765,
        "end": 26.365
      },
      {
        "text": "Nhật",
        "start": 26.365,
        "end": 26.755
      },
      {
        "text": "về.",
        "start": 26.755,
        "end": 27.228
      },
      {
        "text": "Anh",
        "start": 27.978,
        "end": 28.218
      },
      {
        "text": "thích",
        "start": 28.218,
        "end": 28.488
      },
      {
        "text": "đi",
        "start": 28.488,
        "end": 28.778
      },
      {
        "text": "dạo",
        "start": 28.778,
        "end": 29.018
      },
      {
        "text": "ban",
        "start": 29.018,
        "end": 29.258
      },
      {
        "text": "đêm",
        "start": 29.258,
        "end": 29.498
      },
      {
        "text": "trên",
        "start": 29.498,
        "end": 29.788
      },
      {
        "text": "bãi",
        "start": 29.788,
        "end": 30.028
      },
      {
        "text": "biển,",
        "start": 30.028,
        "end": 30.268
      },
      {
        "text": "tuyệt",
        "start": 30.268,
        "end": 30.748
      },
      {
        "text": "lắm!",
        "start": 30.748,
        "end": 31.013
      }
    ]
  },
  {
    "speaker": "woman",
    "start": 32.069,
    "end": 36.117,
    "words": [
      {
        "text": "Ở",
        "start": 32.069,
        "end": 32.299
      },
      {
        "text": "Vũng",
        "start": 32.299,
        "end": 32.599
      },
      {
        "text": "Tàu",
        "start": 32.599,
        "end": 32.829
      },
      {
        "text": "hai",
        "start": 32.829,
        "end": 33.059
      },
      {
        "text": "ngày",
        "start": 33.059,
        "end": 33.289
      },
      {
        "text": "à?",
        "start": 33.289,
        "end": 33.519
      },
      {
        "text": "Vậy",
        "start": 34.343,
        "end": 34.583
      },
      {
        "text": "anh",
        "start": 34.583,
        "end": 34.843
      },
      {
        "text": "định",
        "start": 34.843,
        "end": 35.083
      },
      {
        "text": "ở",
        "start": 35.083,
        "end": 35.373
      },
      {
        "text": "khách",
        "start": 35.373,
        "end": 35.613
      },
      {
        "text": "sạn",
        "start": 35.613,
        "end": 35.863
      },
      {
        "text": "nào?",
        "start": 35.863,
        "end": 36.113
      }
    ]
  },
  {
    "speaker": "man",
    "start": 36.86,
    "end": 43.266,
    "words": [
      {
        "text": "Chà,",
        "start": 36.94,
        "end": 37.29
      },
      {
        "text": "để",
        "start": 37.29,
        "end": 37.82
      },
      {
        "text": "xem.",
        "start": 37.82,
        "end": 38.24
      },
      {
        "text": "Có",
        "start": 39.182,
        "end": 39.432
      },
      {
        "text": "lẽ",
        "start": 39.432,
        "end": 39.692
      },
      {
        "text": "lần",
        "start": 39.692,
        "end": 39.942
      },
      {
        "text": "này",
        "start": 39.942,
        "end": 40.202
      },
      {
        "text": "mình",
        "start": 40.202,
        "end": 40.462
      },
      {
        "text": "thuê",
        "start": 40.462,
        "end": 40.742
      },
      {
        "text": "phòng",
        "start": 40.742,
        "end": 41.052
      },
      {
        "text": "ở",
        "start": 41.052,
        "end": 41.302
      },
      {
        "text": "một",
        "start": 41.302,
        "end": 41.602
      },
      {
        "text": "khách",
        "start": 41.602,
        "end": 41.862
      },
      {
        "text": "sạn",
        "start": 41.862,
        "end": 42.112
      },
      {
        "text": "lớn",
        "start": 42.112,
        "end": 42.432
      },
      {
        "text": "gần",
        "start": 42.442,
        "end": 42.692
      },
      {
        "text": "bãi",
        "start": 42.692,
        "end": 42.952
      },
      {
        "text": "biển.",
        "start": 42.952,
        "end": 43.266
      }
    ]
  },
  {
    "speaker": "woman",
    "start": 44.541,
    "end": 47.697,
    "words": [
      {
        "text": "Nhưng",
        "start": 44.541,
        "end": 44.741
      },
      {
        "text": "anh",
        "start": 44.741,
        "end": 44.971
      },
      {
        "text": "có",
        "start": 44.971,
        "end": 45.171
      },
      {
        "text": "biết",
        "start": 45.171,
        "end": 45.461
      },
      {
        "text": "ở",
        "start": 45.461,
        "end": 45.741
      },
      {
        "text": "khách",
        "start": 45.741,
        "end": 45.941
      },
      {
        "text": "sạn",
        "start": 45.941,
        "end": 46.151
      },
      {
        "text": "lớn",
        "start": 46.151,
        "end": 46.351
      },
      {
        "text": "bao",
        "start": 46.351,
        "end": 46.551
      },
      {
        "text": "nhiêu",
        "start": 46.551,
        "end": 46.851
      },
      {
        "text": "tiền",
        "start": 46.851,
        "end": 47.061
      },
      {
        "text": "một",
        "start": 47.061,
        "end": 47.271
      },
      {
        "text": "đêm",
        "start": 47.271,
        "end": 47.471
      },
      {
        "text": "không?",
        "start": 47.471,
        "end": 47.697
      }
    ]
  },
  {
    "speaker": "man",
    "start": 48.663,
    "end": 54.112,
    "words": [
      {
        "text": "Ừm,",
        "start": 48.683,
        "end": 48.943
      },
      {
        "text": "anh",
        "start": 48.943,
        "end": 49.163
      },
      {
        "text": "không",
        "start": 49.163,
        "end": 49.403
      },
      {
        "text": "biết.",
        "start": 49.403,
        "end": 49.633
      },
      {
        "text": "Nghe",
        "start": 50.638,
        "end": 50.838
      },
      {
        "text": "nói",
        "start": 50.838,
        "end": 51.038
      },
      {
        "text": "mùa",
        "start": 51.038,
        "end": 51.248
      },
      {
        "text": "này",
        "start": 51.248,
        "end": 51.448
      },
      {
        "text": "ít",
        "start": 51.448,
        "end": 51.658
      },
      {
        "text": "du",
        "start": 51.658,
        "end": 51.858
      },
      {
        "text": "khách,",
        "start": 51.858,
        "end": 52.068
      },
      {
        "text": "giá",
        "start": 52.622,
        "end": 52.842
      },
      {
        "text": "khách",
        "start": 52.842,
        "end": 53.072
      },
      {
        "text": "sạn",
        "start": 53.072,
        "end": 53.302
      },
      {
        "text": "không",
        "start": 53.302,
        "end": 53.602
      },
      {
        "text": "đắt",
        "start": 53.602,
        "end": 53.882
      },
      {
        "text": "lắm.",
        "start": 53.882,
        "end": 54.112
      }
    ]
  },
  {
    "speaker": "woman",
    "start": 54.997,
    "end": 57.707,
    "words": [
      {
        "text": "Nhưng",
        "start": 54.997,
        "end": 55.207
      },
      {
        "text": "ít",
        "start": 55.207,
        "end": 55.497
      },
      {
        "text": "nhất",
        "start": 55.497,
        "end": 55.867
      },
      {
        "text": "cũng",
        "start": 55.937,
        "end": 56.147
      },
      {
        "text": "phải",
        "start": 56.147,
        "end": 56.367
      },
      {
        "text": "hơn",
        "start": 56.367,
        "end": 56.577
      },
      {
        "text": "ba",
        "start": 56.577,
        "end": 56.847
      },
      {
        "text": "trăm",
        "start": 56.847,
        "end": 57.057
      },
      {
        "text": "ngàn",
        "start": 57.057,
        "end": 57.277
      },
      {
        "text": "một",
        "start": 57.277,
        "end": 57.487
      },
      {
        "text": "đêm.",
        "start": 57.487,
        "end": 57.707
      }
    ]
  },
  {
    "speaker": "man",
    "start": 58.736,
    "end": 62.446,
    "words": [
      {
        "text": "Ừ,",
        "start": 58.786,
        "end": 59.296
      },
      {
        "text": "có",
        "start": 59.656,
        "end": 59.926
      },
      {
        "text": "lẽ",
        "start": 59.926,
        "end": 60.206
      },
      {
        "text": "khoảng",
        "start": 60.206,
        "end": 60.576
      },
      {
        "text": "trên",
        "start": 60.576,
        "end": 60.856
      },
      {
        "text": "ba",
        "start": 60.856,
        "end": 61.216
      },
      {
        "text": "trăm",
        "start": 61.216,
        "end": 61.486
      },
      {
        "text": "ngàn",
        "start": 61.486,
        "end": 61.846
      },
      {
        "text": "một",
        "start": 61.846,
        "end": 62.116
      },
      {
        "text": "đêm.",
        "start": 62.116,
        "end": 62.416
      }
    ]
  },
  {
    "speaker": "woman",
    "start": 62.951,
    "end": 68.13,
    "words": [
      {
        "text": "Đắt",
        "start": 62.951,
        "end": 63.371
      },
      {
        "text": "quá",
        "start": 63.371,
        "end": 63.541
      },
      {
        "text": "anh",
        "start": 63.541,
        "end": 63.711
      },
      {
        "text": "à!",
        "start": 63.711,
        "end": 63.881
      },
      {
        "text": "Hay",
        "start": 64.932,
        "end": 65.122
      },
      {
        "text": "là",
        "start": 65.122,
        "end": 65.322
      },
      {
        "text": "mình",
        "start": 65.322,
        "end": 65.612
      },
      {
        "text": "chỉ",
        "start": 65.612,
        "end": 65.812
      },
      {
        "text": "đi",
        "start": 65.812,
        "end": 66.052
      },
      {
        "text": "trong",
        "start": 66.052,
        "end": 66.252
      },
      {
        "text": "ngày",
        "start": 66.252,
        "end": 66.462
      },
      {
        "text": "thôi,",
        "start": 66.462,
        "end": 66.662
      },
      {
        "text": "không",
        "start": 66.662,
        "end": 67.222
      },
      {
        "text": "phải",
        "start": 67.222,
        "end": 67.512
      },
      {
        "text": "thuê",
        "start": 67.512,
        "end": 67.712
      },
      {
        "text": "khách",
        "start": 67.712,
        "end": 67.932
      },
      {
        "text": "sạn?",
        "start": 67.932,
        "end": 68.13
      }
    ]
  },
  {
    "speaker": "man",
    "start": 69.417,
    "end": 78.884,
    "words": [
      {
        "text": "Ừ",
        "start": 69.417,
        "end": 69.657
      },
      {
        "text": "nhỉ.",
        "start": 69.657,
        "end": 69.92
      },
      {
        "text": "Có",
        "start": 70.876,
        "end": 71.076
      },
      {
        "text": "lẽ",
        "start": 71.076,
        "end": 71.276
      },
      {
        "text": "em",
        "start": 71.276,
        "end": 71.476
      },
      {
        "text": "nói",
        "start": 71.476,
        "end": 71.676
      },
      {
        "text": "đúng",
        "start": 71.676,
        "end": 71.876
      },
      {
        "text": "đấy.",
        "start": 71.876,
        "end": 72.086
      },
      {
        "text": "Lần",
        "start": 72.926,
        "end": 73.136
      },
      {
        "text": "này",
        "start": 73.136,
        "end": 73.356
      },
      {
        "text": "chúng",
        "start": 73.356,
        "end": 73.626
      },
      {
        "text": "ta",
        "start": 73.626,
        "end": 73.846
      },
      {
        "text": "chỉ",
        "start": 73.846,
        "end": 74.126
      },
      {
        "text": "đi",
        "start": 74.126,
        "end": 74.346
      },
      {
        "text": "một",
        "start": 74.346,
        "end": 74.566
      },
      {
        "text": "ngày",
        "start": 74.566,
        "end": 74.786
      },
      {
        "text": "thôi",
        "start": 74.786,
        "end": 75.026
      },
      {
        "text": "cũng",
        "start": 75.026,
        "end": 75.276
      },
      {
        "text": "được.",
        "start": 75.276,
        "end": 75.496
      },
      {
        "text": "Sang",
        "start": 76.505,
        "end": 76.715
      },
      {
        "text": "năm",
        "start": 76.715,
        "end": 76.925
      },
      {
        "text": "chúng",
        "start": 76.925,
        "end": 77.175
      },
      {
        "text": "ta",
        "start": 77.175,
        "end": 77.385
      },
      {
        "text": "sẽ",
        "start": 77.385,
        "end": 77.595
      },
      {
        "text": "ở",
        "start": 77.595,
        "end": 77.815
      },
      {
        "text": "lại",
        "start": 77.815,
        "end": 78.025
      },
      {
        "text": "Vũng",
        "start": 78.025,
        "end": 78.235
      },
      {
        "text": "Tàu",
        "start": 78.235,
        "end": 78.445
      },
      {
        "text": "ban",
        "start": 78.445,
        "end": 78.655
      },
      {
        "text": "đêm.",
        "start": 78.655,
        "end": 78.884
      }
    ]
  }
];
