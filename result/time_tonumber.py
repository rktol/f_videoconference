# coding: UTF-8

import csv
import os
import glob


groups = ["1", "2"]
condition = ["0","1", "2"]
id = ["0","1", "2", "3","4","5"]
names = [["yokoyama","tsunoda","tamura","konishi","ishibashi","ichikawa"],["ohyama","sugiyama","suzuki","sei","tanokashira","nishikawa"]]
rate = [[[-0.876,4.838,12.059,3.353,10.608,0.165],[2.020,6.760,11.162,7.617,6.764,6.550],[3.170,2.390,2.750,2.980,3.336,0.460]],[[-0.619,3.820,0.740,-0.420,-0.820,-3.180],[-3.250,-4.040,0.980,-0.930,-3.280,4.040],[0.00,-5.190,-3.980,1.550,-0.170,-5.170]]]
# rate = [[[-0.876,4.838,12.059,3.353,10.608,0.165],[2.020,6.760,11.162,7.617,6.764,6.550],[3.170,2.390,2.750,2.980,3.336,0.460]],[[-0.619,3.820,0.740,-0.420,-0.820,-3.180],[-3.250,-4.040,0.980,-0.930,-3.280,4.040],[0.00,-5.190,-3.980,1.550,-0.170,-5.170]],[[C0],[C1],[C2]]]

filenames = []

for g_index,group in enumerate(groups):
    for c_index,c in enumerate(condition):
        for name_index,name in enumerate(names[g_index]):
            path ='{0}/{1}_{2}*.csv'.format(group,name,c)
            # print(rate[g_index][c_index][name_index])
            print('group{0},condition{1},name is {2},rate{3}'.format(group,c,name,rate[g_index][c_index][name_index]))
            filelist = glob.glob(path)
            for file in filelist:
                filenames.append(file)
                data = []
                with open(file,encoding="utf-8-sig") as f:
                    reader = csv.reader(f)
                    for index,row in enumerate(reader):
                        tmp = []
                        if(index == 0):
                            data.append(row)
                        else:
                            for n,col in enumerate(row):
                                if(n == 0 or n == 1):
                                    times = float(col)
                                    times = times + rate[g_index][c_index][name_index]
                                    tmp.append(times)
                                else:
                                    tmp.append(col)
                            data.append(tmp)

                with open('./analysisdata/{0}'.format(file), 'w', newline="",encoding="utf-8") as g:
                    writer = csv.writer(g, lineterminator='\n')
                    for row in data:
                        writer.writerow(row)

